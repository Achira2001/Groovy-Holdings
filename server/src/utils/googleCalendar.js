const crypto = require('crypto');
const { google } = require('googleapis');
const env = require('../config/env');
const Setting = require('../models/Setting');

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
];
const SETTING_KEY = 'googleCalendar';

function oauthClient() {
  return new google.auth.OAuth2(env.google.clientId, env.google.clientSecret, env.google.redirectUri);
}

function isOAuthConfigured() {
  return Boolean(env.google.clientId && env.google.clientSecret);
}

function getAuthUrl(state) {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
}

/** Exchange the OAuth code and store the refresh token. */
async function handleCallback(code) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  let email;
  if (tokens.id_token) {
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.google.clientId });
    email = ticket.getPayload().email;
  }
  const existing = (await Setting.get(SETTING_KEY)) || {};
  await Setting.set(SETTING_KEY, {
    refreshToken: tokens.refresh_token || existing.refreshToken,
    email: email || existing.email,
    connectedAt: new Date(),
  });
  return { email };
}

async function getStatus() {
  const saved = await Setting.get(SETTING_KEY);
  return {
    oauthConfigured: isOAuthConfigured(),
    connected: Boolean(saved?.refreshToken || env.google.refreshToken),
    email: saved?.email || null,
    connectedAt: saved?.connectedAt || null,
    source: saved?.refreshToken ? 'dashboard' : env.google.refreshToken ? 'env' : null,
  };
}

async function disconnect() {
  await Setting.deleteOne({ key: SETTING_KEY });
}

async function authorizedClient() {
  if (!isOAuthConfigured()) return null;
  const saved = await Setting.get(SETTING_KEY);
  const refreshToken = saved?.refreshToken || env.google.refreshToken;
  if (!refreshToken) return null;
  const client = oauthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

/**
 * Creates a Google Calendar event with a Google Meet link.
 * Attendees receive Google Calendar invitations/notifications automatically.
 * Returns null when Google Calendar is not connected.
 */
async function createMeetEvent({ summary, description, start, end, attendees = [] }) {
  const auth = await authorizedClient();
  if (!auth) return null;
  const calendar = google.calendar({ version: 'v3', auth });
  const { data } = await calendar.events.insert({
    calendarId: env.google.calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary,
      description,
      start: { dateTime: new Date(start).toISOString(), timeZone: env.timezone },
      end: { dateTime: new Date(end).toISOString(), timeZone: env.timezone },
      attendees: attendees.filter(Boolean).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    },
  });
  const video = data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video');
  return { eventId: data.id, meetLink: data.hangoutLink || video?.uri || null, htmlLink: data.htmlLink };
}

async function cancelEvent(eventId) {
  if (!eventId) return;
  const auth = await authorizedClient();
  if (!auth) return;
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({ calendarId: env.google.calendarId, eventId, sendUpdates: 'all' });
  } catch (err) {
    if (err.code !== 404 && err.code !== 410) console.warn('⚠ Could not delete calendar event:', err.message);
  }
}

module.exports = { getAuthUrl, handleCallback, getStatus, disconnect, createMeetEvent, cancelEvent, isOAuthConfigured };
