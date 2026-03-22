#!/usr/bin/env node

/**
 * RVFU API Auth Flow - Standalone Test Script v2
 * 
 * Follows the manual's exact 3-step auth flow PLUS the ForgeRock CDSSO flow:
 *   Step 1: POST /sso/json/authenticate → get tokenId (iPlanetDirectoryPro)
 *   Step 2: POST /sso/oauth2/authorize  → get authorization code
 *   Step 3: POST /sso/oauth2/access_token → get id_token, access_token, refresh_token
 *   Step 4: GET  API endpoint → get 302 redirect to CDSSO
 *   Step 5: Follow CDSSO redirect → SSO /oauth2/authorize → form_post with id_token
 *   Step 6: POST /agent/cdsso-oauth2 with id_token → get session cookies
 *   Step 7: Retry API call with session cookies → success!
 *
 * Usage: node test-rvfu-auth-flow.js [--use-access-token]
 *
 * Requires: VPN connection to ACI network
 */

const https = require('https');
const http = require('http');

// ========== CONFIGURATION ==========
const CONFIG = {
    ssoHost: 'ssoformazione.ilportaledeltrasporto.it',
    ssoBasePath: '/sso',
    apiHost: 'formazione.ilportaledeltrasporto.it',

    username: 'DETO003001',
    password: 'TEST.030',

    clientId: 'AUTODEM.RESCUEMANAGER',
    clientSecret: 'R2Y2L9T2',
    redirectUri: 'https://localhost/',

    scope: 'openid profile',
    responseType: 'code',
    state: 'abc123',
    nonce: '123abc',
    decision: 'allow',

    testEndpoint: '/demolitori-aci-ws/rest/cr/veicolo',
    testParams: {
        causale: 'DEMOLIZIONE',
        tipoVeicolo: 'A',
        targa: 'VA054AJ',
    },
};

const useAccessToken = process.argv.includes('--use-access-token');

// ========== HELPERS ==========

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const isHttps = options.port === 443 || (!options.port && !options.protocol) || options.protocol === 'https:';
        const httpModule = isHttps ? https : http;

        const reqOptions = { ...options };
        delete reqOptions.protocol;
        if (!reqOptions.port) reqOptions.port = isHttps ? 443 : 80;

        const req = httpModule.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    headers: res.headers,
                    body: data,
                    cookies: parseCookies(res.headers['set-cookie']),
                });
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('Timeout 30s')));
        if (postData) req.write(postData);
        req.end();
    });
}

function parseCookies(setCookieHeaders) {
    if (!setCookieHeaders) return {};
    const cookies = {};
    const arr = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    for (const h of arr) {
        const [nv] = h.split(';');
        const eq = nv.indexOf('=');
        if (eq > 0) cookies[nv.substring(0, eq).trim()] = nv.substring(eq + 1).trim();
    }
    return cookies;
}

function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return { error: 'Not a valid JWT' };
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        const exp = payload.exp ? new Date(payload.exp * 1000) : null;
        return {
            payload,
            expiry: exp ? { date: exp.toISOString(), isExpired: exp < new Date(), expiresInSeconds: Math.floor((exp - Date.now()) / 1000) } : null,
        };
    } catch (e) { return { error: e.message }; }
}

const sep = (t) => console.log('\n' + '='.repeat(70) + '\n  ' + t + '\n' + '='.repeat(70));
const ok = (m) => console.log(`  ✅ ${m}`);
const fail = (m) => console.log(`  ❌ ${m}`);
const info = (m) => console.log(`  ℹ️  ${m}`);

// ========== MAIN ==========

async function main() {
    console.log('🧪 RVFU API Auth Flow Test v2 (with CDSSO)');
    console.log(`📅 ${new Date().toISOString()}`);
    console.log(`🔧 Client: ${CONFIG.clientId} | User: ${CONFIG.username} | Bearer: ${useAccessToken ? 'access_token' : 'id_token'}`);

    // Collected cookies from all steps
    const allCookies = {};

    // ===== STEP 1: AUTHENTICATE =====
    sep('STEP 1: AUTHENTICATE');

    let tokenId;
    try {
        const res = await makeRequest({
            hostname: CONFIG.ssoHost, port: 443, method: 'POST',
            path: `${CONFIG.ssoBasePath}/json/authenticate`,
            headers: {
                'Content-Type': 'application/json',
                'X-OpenAM-Username': CONFIG.username,
                'X-OpenAM-Password': CONFIG.password,
                'Accept-API-Version': 'resource=2.0, protocol=1.0',
            },
        }, '{}');

        if (res.statusCode !== 200) { fail(`${res.statusCode}: ${res.body.substring(0, 200)}`); return; }

        const data = JSON.parse(res.body);
        tokenId = data.tokenId;
        ok(`tokenId: ${tokenId.substring(0, 40)}...`);
        Object.assign(allCookies, res.cookies);
        if (res.cookies.iPlanetDirectoryPro) ok('iPlanetDirectoryPro in Set-Cookie');
    } catch (e) {
        fail(`${e.message}${e.code === 'ENOTFOUND' ? ' - Is VPN connected?' : ''}`);
        return;
    }

    // ===== STEP 2: AUTHORIZE =====
    sep('STEP 2: AUTHORIZE');

    let authCode;
    try {
        const postData = new URLSearchParams({
            scope: CONFIG.scope, response_type: CONFIG.responseType, client_id: CONFIG.clientId,
            csrf: tokenId, redirect_uri: CONFIG.redirectUri, state: CONFIG.state,
            nonce: CONFIG.nonce, decision: CONFIG.decision,
        }).toString();

        const res = await makeRequest({
            hostname: CONFIG.ssoHost, port: 443, method: 'POST',
            path: `${CONFIG.ssoBasePath}/oauth2/authorize`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': `iPlanetDirectoryPro=${tokenId}` },
        }, postData);

        if (res.statusCode !== 302) { fail(`Expected 302, got ${res.statusCode}: ${res.body.substring(0, 300)}`); return; }

        const loc = new URL(res.headers.location);
        authCode = loc.searchParams.get('code');
        const err = loc.searchParams.get('error');
        if (err) { fail(`OAuth error: ${err} - ${loc.searchParams.get('error_description')}`); return; }
        if (!authCode) { fail('No code in redirect'); return; }

        ok(`code: ${authCode.substring(0, 25)}...`);
        Object.assign(allCookies, res.cookies);
    } catch (e) { fail(e.message); return; }

    // ===== STEP 3: TOKEN EXCHANGE =====
    sep('STEP 3: TOKEN EXCHANGE');

    let tokens;
    try {
        const postData = new URLSearchParams({
            grant_type: 'authorization_code', code: authCode,
            client_id: CONFIG.clientId, client_secret: CONFIG.clientSecret,
            redirect_uri: CONFIG.redirectUri,
        }).toString();

        const res = await makeRequest({
            hostname: CONFIG.ssoHost, port: 443, method: 'POST',
            path: `${CONFIG.ssoBasePath}/oauth2/access_token`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }, postData);

        if (res.statusCode !== 200) { fail(`${res.statusCode}: ${res.body.substring(0, 300)}`); return; }

        tokens = JSON.parse(res.body);
        ok(`access_token: ${tokens.access_token?.substring(0, 15)}... (${tokens.access_token?.length} chars)`);
        ok(`id_token: ${tokens.id_token?.substring(0, 15)}... (${tokens.id_token?.length} chars, JWT)`);
        ok(`refresh_token: ${tokens.refresh_token?.substring(0, 15)}...`);
        console.log(`     expires_in: ${tokens.expires_in}s | scope: ${tokens.scope}`);

        if (tokens.id_token) {
            const d = decodeJWT(tokens.id_token);
            if (!d.error) {
                const p = d.payload;
                console.log(`\n  🔍 id_token JWT payload:`);
                console.log(`     sub: ${p.sub} | aud: ${p.aud} | azp: ${p.azp}`);
                console.log(`     name: ${p.name} | family_name: ${p.family_name}`);
                console.log(`     iss: ${p.iss}`);
                if (d.expiry) console.log(`     exp: ${d.expiry.date} (${d.expiry.isExpired ? '❌ EXPIRED' : `✅ ${d.expiry.expiresInSeconds}s left`})`);
                (p.aud === CONFIG.clientId ? ok : fail)(`Audience: "${p.aud}" ${p.aud === CONFIG.clientId ? '==' : '!='} "${CONFIG.clientId}"`);
            }
        }
    } catch (e) { fail(e.message); return; }

    // ===== STEP 4: FIRST API CALL (expect 302 CDSSO redirect) =====
    sep('STEP 4: API CALL → expect CDSSO 302 redirect');

    const queryParams = new URLSearchParams(CONFIG.testParams).toString();
    const apiPath = `${CONFIG.testEndpoint}?${queryParams}`;
    const bearerToken = useAccessToken ? tokens.access_token : tokens.id_token;

    let cdssoRedirectUrl;
    try {
        console.log(`  📤 GET https://${CONFIG.apiHost}${apiPath}`);

        const res = await makeRequest({
            hostname: CONFIG.apiHost, port: 443, method: 'GET',
            path: apiPath,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${bearerToken}`,
                'Cookie': `iPlanetDirectoryPro=${tokenId}`,
            },
        });

        console.log(`  📥 Status: ${res.statusCode}`);

        if (res.statusCode >= 200 && res.statusCode < 300) {
            ok('API call succeeded WITHOUT CDSSO! (unexpected but great)');
            console.log('  📄 Response:', res.body.substring(0, 2000));
            return; // Done!
        }

        if (res.statusCode === 302) {
            cdssoRedirectUrl = res.headers.location;
            info(`CDSSO redirect (expected): ${cdssoRedirectUrl.substring(0, 120)}...`);
            Object.assign(allCookies, res.cookies);

            // Parse the CDSSO redirect to understand what the Web Agent wants
            const rUrl = new URL(cdssoRedirectUrl);
            console.log(`     client_id: ${rUrl.searchParams.get('client_id')}`);
            console.log(`     response_mode: ${rUrl.searchParams.get('response_mode')}`);
            console.log(`     redirect_uri: ${rUrl.searchParams.get('redirect_uri')}`);
            console.log(`     response_type: ${rUrl.searchParams.get('response_type')}`);
        } else {
            fail(`Unexpected status ${res.statusCode}: ${res.body.substring(0, 500)}`);
            return;
        }
    } catch (e) { fail(e.message); return; }

    // ===== STEP 5: Follow CDSSO redirect → SSO /oauth2/authorize =====
    sep('STEP 5: Follow CDSSO redirect → SSO authorize');

    let cdssoFormAction, cdssoIdToken;
    try {
        const cdssoUrl = new URL(cdssoRedirectUrl);
        console.log(`  📤 GET ${cdssoUrl.pathname}${cdssoUrl.search.substring(0, 80)}...`);
        console.log(`     on host: ${cdssoUrl.hostname}`);
        console.log(`     Cookie: iPlanetDirectoryPro (already authenticated)`);

        // Send the request to the SSO authorize endpoint with iPlanetDirectoryPro cookie
        // Since we already have a valid SSO session, the SSO should auto-approve and return form_post
        const res = await makeRequest({
            hostname: cdssoUrl.hostname,
            port: parseInt(cdssoUrl.port) || 443,
            method: 'GET',
            path: cdssoUrl.pathname + cdssoUrl.search,
            headers: {
                'Cookie': `iPlanetDirectoryPro=${tokenId}`,
            },
        });

        console.log(`  📥 Status: ${res.statusCode}`);
        console.log(`     Content-Type: ${res.headers['content-type'] || 'not set'}`);
        Object.assign(allCookies, res.cookies);

        if (res.statusCode === 200) {
            // Expect HTML with auto-submit form containing id_token
            const body = res.body;

            // Extract form action
            const actionMatch = body.match(/action="([^"]+)"/);
            cdssoFormAction = actionMatch ? actionMatch[1] : null;

            // Extract id_token from form
            const tokenMatch = body.match(/name="id_token"\s+value="([^"]+)"/i) ||
                body.match(/name="id_token"\s*value="([^"]+)"/i);
            cdssoIdToken = tokenMatch ? tokenMatch[1] : null;

            ok(`Form action: ${cdssoFormAction || 'NOT FOUND'}`);
            ok(`CDSSO id_token: ${cdssoIdToken ? cdssoIdToken.substring(0, 30) + '... (' + cdssoIdToken.length + ' chars)' : 'NOT FOUND'}`);

            if (cdssoIdToken) {
                const d = decodeJWT(cdssoIdToken);
                if (!d.error) {
                    console.log(`     CDSSO token aud: ${d.payload.aud} | sub: ${d.payload.sub}`);
                    info(`This CDSSO id_token has aud="${d.payload.aud}" (Web Agent's client), different from our "${CONFIG.clientId}"`);
                }
            }

            if (!cdssoFormAction || !cdssoIdToken) {
                fail('Could not extract form data from CDSSO response');
                console.log('  📄 HTML:', body.substring(0, 2000));
                return;
            }
        } else if (res.statusCode === 302) {
            // SSO might redirect again (e.g., to login page if session expired)
            fail(`SSO redirected instead of returning form_post: ${res.headers.location}`);
            info('The iPlanetDirectoryPro session may have expired');
            return;
        } else {
            fail(`Unexpected: ${res.statusCode} - ${res.body.substring(0, 500)}`);
            return;
        }
    } catch (e) { fail(e.message); return; }

    // ===== STEP 6: POST id_token to /agent/cdsso-oauth2 =====
    sep('STEP 6: POST CDSSO id_token → establish Web Agent session');

    try {
        // Parse the form action URL (may be http://formazione.ilportaledeltrasporto.it:80/agent/cdsso-oauth2)
        const formUrl = new URL(cdssoFormAction);
        const isFormHttps = formUrl.protocol === 'https:';
        const formPort = parseInt(formUrl.port) || (isFormHttps ? 443 : 80);

        console.log(`  📤 POST ${formUrl.pathname}`);
        console.log(`     on: ${formUrl.protocol}//${formUrl.hostname}:${formPort}`);
        console.log(`     id_token length: ${cdssoIdToken.length}`);

        // Build form data  
        const formData = `id_token=${encodeURIComponent(cdssoIdToken)}`;

        // Build cookie string from all collected cookies
        const cookieStr = Object.entries(allCookies).map(([k, v]) => `${k}=${v}`).join('; ');

        const res = await makeRequest({
            hostname: formUrl.hostname,
            port: formPort,
            method: 'POST',
            path: formUrl.pathname,
            protocol: formUrl.protocol,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookieStr || `iPlanetDirectoryPro=${tokenId}`,
            },
        }, formData);

        console.log(`  📥 Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`     Content-Type: ${res.headers['content-type'] || 'not set'}`);

        // Log ALL Set-Cookie headers (critical for session establishment)
        if (res.headers['set-cookie']) {
            const cookies = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'] : [res.headers['set-cookie']];
            console.log(`     Set-Cookie headers (${cookies.length}):`);
            for (const c of cookies) {
                console.log(`       🍪 ${c.substring(0, 120)}${c.length > 120 ? '...' : ''}`);
            }
        }

        // Merge new cookies
        Object.assign(allCookies, res.cookies);

        if (res.statusCode === 302 || res.statusCode === 301) {
            const redirectTo = res.headers.location;
            ok(`CDSSO completed! Redirect to: ${redirectTo}`);
            info('Web Agent session should now be established');

            // The redirect should be back to our original API URL
            // We'll follow it in step 7
        } else if (res.statusCode === 200) {
            ok('CDSSO completed (200 OK)');
            info('Response body (first 500 chars): ' + res.body.substring(0, 500));
        } else {
            fail(`Unexpected: ${res.statusCode}`);
            console.log('  📄 Body:', res.body.substring(0, 1000));
            // Don't return - still try the API call
        }

        console.log(`\n  📋 All cookies collected so far:`);
        for (const [name, value] of Object.entries(allCookies)) {
            console.log(`     🍪 ${name}: ${value.substring(0, 40)}${value.length > 40 ? '...' : ''}`);
        }
    } catch (e) { fail(e.message); /* Don't return - try api call anyway */ }

    // ===== STEP 7: RETRY API CALL with Web Agent session cookies =====
    sep('STEP 7: RETRY API CALL with CDSSO session cookies');

    try {
        const cookieStr = Object.entries(allCookies).map(([k, v]) => `${k}=${v}`).join('; ');

        console.log(`  📤 GET https://${CONFIG.apiHost}${apiPath}`);
        console.log(`     Authorization: Bearer {${useAccessToken ? 'access_token' : 'id_token'}}`);
        console.log(`     Cookie: ${Object.keys(allCookies).join(', ')} (${cookieStr.length} chars)`);

        // Test A: ALL cookies + Bearer token
        console.log('\n  --- TEST A: Bearer + ALL session cookies ---');
        const resA = await makeRequest({
            hostname: CONFIG.apiHost, port: 443, method: 'GET',
            path: apiPath,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${bearerToken}`,
                'Cookie': cookieStr,
            },
        });

        console.log(`  📥 Status: ${resA.statusCode} ${resA.statusMessage}`);
        console.log(`     Content-Type: ${resA.headers['content-type'] || 'not set'}`);

        if (resA.statusCode >= 200 && resA.statusCode < 300) {
            ok('🎉 API CALL SUCCEEDED!');
            const ct = resA.headers['content-type'] || '';
            if (ct.includes('application/json')) {
                try {
                    const data = JSON.parse(resA.body);
                    console.log('  📄 Response (JSON):');
                    console.log(JSON.stringify(data, null, 2).split('\n').map(l => '     ' + l).join('\n'));
                } catch { console.log('  📄 Body:', resA.body.substring(0, 2000)); }
            } else {
                console.log('  📄 Body:', resA.body.substring(0, 2000));
            }
        } else if (resA.statusCode === 302) {
            fail(`Still getting CDSSO redirect: ${resA.headers.location?.substring(0, 120)}`);
            info('The CDSSO session cookies may not have been set correctly');
            info('This could mean:');
            info('  - The /agent/cdsso-oauth2 endpoint did not set the expected cookies');
            info('  - The cookies are domain-specific and not being sent correctly');
            info('  - CDSSO requires a browser (JavaScript execution for cookie setting)');
        } else if (resA.statusCode === 403) {
            fail('403 Forbidden - Web Agent still blocking');
            console.log('  📄 Body:', resA.body.substring(0, 500));
        } else if (resA.statusCode === 401) {
            fail('401 Unauthorized');
            console.log('  📄 Body:', resA.body.substring(0, 500));
        } else {
            fail(`Status ${resA.statusCode}: ${resA.body.substring(0, 500)}`);
        }

        // Test B: ONLY session cookies (no Bearer)
        console.log('\n  --- TEST B: ONLY session cookies (no Bearer) ---');
        const resB = await makeRequest({
            hostname: CONFIG.apiHost, port: 443, method: 'GET',
            path: apiPath,
            headers: {
                'Accept': 'application/json',
                'Cookie': cookieStr,
            },
        });

        console.log(`  📥 Status: ${resB.statusCode} ${resB.statusMessage}`);
        if (resB.statusCode >= 200 && resB.statusCode < 300) {
            ok('🎉 API CALL SUCCEEDED (cookies only, no Bearer needed)!');
            console.log('  📄 Body:', resB.body.substring(0, 2000));
        } else {
            info(`${resB.statusCode} - ${resB.statusMessage}`);
        }
    } catch (e) { fail(e.message); }

    // ===== SUMMARY =====
    sep('SUMMARY');
    ok('Auth flow Steps 1-3 completed successfully');
    ok(`id_token audience: ${decodeJWT(tokens.id_token).payload?.aud}`);
    console.log(`  📋 Final cookie jar: ${Object.keys(allCookies).join(', ')}`);
    console.log('\n  💡 If Step 7 still fails with 302:');
    console.log('     → CDSSO requires a BROWSER to complete (JavaScript auto-submit of form)');
    console.log('     → Solution: use Electron BrowserWindow for CDSSO, then net.request for API');
    console.log('     → The iPlanetDirectoryPro from /authenticate is for SSO, not for the Web Agent');
    console.log('     → The Web Agent sets its OWN cookies (am-auth-jwt) via the CDSSO form_post');
}

main().catch(e => { console.error('💥', e); process.exit(1); });
