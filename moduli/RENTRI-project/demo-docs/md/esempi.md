## Esempi in C#

### Certificato AgID (CNS)

Esempio di codice in Microsoft C# .NET che permette di eseguire il test delle API utilizzando una CNS.

```csharp
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

// Configurazione
var issuer = "XXX"; // Indicare l'identificativo del certificato della CNS e legato al sub
var regId = "XXX"; // Indicare l'identificativo del registro

var aud = "rentrigov.demo.api"; // Per produzione rentrigov.api
var baseApi = "https://demoapi.rentri.gov.it"; // Per produzione https://api.rentri.gov.it
var api = $"{baseApi}/dati-registri/v1.0/operatore/{regId}/movimenti";
var jti = Guid.NewGuid().ToString(); // Id del JWT

var jsonData = @"[{""riferimenti"": { ""numero_registrazione"": { ""anno"": 2024, ""progressivo"": 1 } }}]";

// Dati scambiati
var content = new StringContent(jsonData, System.Text.Encoding.UTF8, "application/json");

// Recupero del certificato
using var storeMy = new X509Store(StoreName.My);
storeMy.Open(OpenFlags.ReadOnly);
var cert = storeMy.Certificates.Cast<X509Certificate2>().First(c => c.HasPrivateKey && c.Subject.Contains(issuer, StringComparison.InvariantCultureIgnoreCase));
var algo = cert.PublicKey.Oid.FriendlyName == "RSA" ? SecurityAlgorithms.RsaSha256 : cert.PublicKey.Oid.FriendlyName == "ECC" ? SecurityAlgorithms.EcdsaSha256 : throw new InvalidOperationException("Unsupported key algorithm");

// ID_AUTH_REST_02
var tokenHandler = new JsonWebTokenHandler();
var tokenDescriptor = new SecurityTokenDescriptor
{
    AdditionalHeaderClaims = new Dictionary<string, object> { { "x5c", new string[] { Convert.ToBase64String(cert.Export(X509ContentType.Cert)) } } },
    Audience = aud,
    Issuer = issuer,
    Claims = new Dictionary<string, object> { { "jti", jti } },
    SigningCredentials = algo == SecurityAlgorithms.RsaSha256 ? new SigningCredentials(new RsaSecurityKey(cert.GetRSAPrivateKey()), algo) : new SigningCredentials(new ECDsaSecurityKey(cert.GetECDsaPrivateKey()), algo)
};
var idAuth = tokenHandler.CreateToken(tokenDescriptor);

// INTEGRITY_REST_01
using var sha256 = SHA256.Create();
var digest = $"SHA-256={Convert.ToBase64String(sha256.ComputeHash(await content.ReadAsByteArrayAsync()))}";

tokenDescriptor.Claims.Add("signed_headers", new Dictionary<string, string>[] {
    new() { { "digest", digest } },
    new() { { "content-type", content.Headers.ContentType?.ToString()! } }
});

var integrity = tokenHandler.CreateToken(tokenDescriptor);

// Client con headers
using var cli = new HttpClient();
cli.DefaultRequestHeaders.Add("Authorization", $"Bearer {idAuth}");
cli.DefaultRequestHeaders.Add("Digest", digest);
cli.DefaultRequestHeaders.Add("Agid-JWT-Signature", integrity);

// Chiamata API
var res = await cli.PostAsync(api, content);
var response = await res.Content.ReadAsStringAsync();
Console.WriteLine(response);
```

### Certificato di dominio

Esempio di codice in Microsoft C# .NET che permette di eseguire il test delle API utilizzando il certificato di dominio RENTRI.

```csharp
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

// Configurazione
var p12 = "XXX"; // Base64 file .p12
var password = "XXX"; // Password del file .p12
var cert = new X509Certificate2(Convert.FromBase64String(p12), password, X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.EphemeralKeySet);
var algo = cert.PublicKey.Oid.FriendlyName == "RSA" ? SecurityAlgorithms.RsaSha256 : cert.PublicKey.Oid.FriendlyName == "ECC" ? SecurityAlgorithms.EcdsaSha256 : throw new InvalidOperationException("Unsupported key algorithm");

var issuer = "XXX"; // Indicare l'identificativo dell'operatore presente nel subject del certificato
var regId = "XXX"; // Indicare l'identificativo del registro

var aud = "rentrigov.demo.api"; // Per produzione rentrigov.api
var baseApi = "https://demoapi.rentri.gov.it"; // Per produzione https://api.rentri.gov.it
var api = $"{baseApi}/dati-registri/v1.0/operatore/{regId}/movimenti";
var jti = Guid.NewGuid().ToString(); // Id del JWT

var jsonData = @"[{""riferimenti"": { ""numero_registrazione"": { ""anno"": 2024, ""progressivo"": 1 } }}]";

// Dati scambiati
var content = new StringContent(jsonData, System.Text.Encoding.UTF8, "application/json");

// ID_AUTH_REST_02
var tokenHandler = new JsonWebTokenHandler();
var tokenDescriptor = new SecurityTokenDescriptor
{
    AdditionalHeaderClaims = new Dictionary<string, object> { { "x5c", new string[] { Convert.ToBase64String(cert.Export(X509ContentType.Cert)) } } },
    Audience = aud,
    Issuer = issuer,
    Claims = new Dictionary<string, object> { { "jti", jti } },
    SigningCredentials = algo == SecurityAlgorithms.RsaSha256 ? new SigningCredentials(new RsaSecurityKey(cert.GetRSAPrivateKey()), algo) : new SigningCredentials(new ECDsaSecurityKey(cert.GetECDsaPrivateKey()), algo)
};
var idAuth = tokenHandler.CreateToken(tokenDescriptor);

// INTEGRITY_REST_01
using var sha256 = SHA256.Create();
var digest = $"SHA-256={Convert.ToBase64String(sha256.ComputeHash(await content.ReadAsByteArrayAsync()))}";

tokenDescriptor.Claims.Add("signed_headers", new Dictionary<string, string>[] {
    new() { { "digest", digest } },
    new() { { "content-type", content.Headers.ContentType?.ToString()! } }
});

var integrity = tokenHandler.CreateToken(tokenDescriptor);

// Client con headers
using var cli = new HttpClient();
cli.DefaultRequestHeaders.Add("Authorization", $"Bearer {idAuth}");
cli.DefaultRequestHeaders.Add("Digest", digest);
cli.DefaultRequestHeaders.Add("Agid-JWT-Signature", integrity);

// Chiamata API
var res = await cli.PostAsync(api, content);
var response = await res.Content.ReadAsStringAsync();
Console.WriteLine(response);

```

## Esempi in PHP

### Certificato di dominio

Esempio di codice in PHP che permette di eseguire il test delle API utilizzando il certificato di dominio RENTRI.

**Nota.** Necessita delle estensioni `openssl` e  `curl` per il corretto funzionamento.

```php
<?php
error_reporting(E_ALL);
ini_set("display_errors", "on");

function base64url_encode($data) {
    $b64 = base64_encode($data);
    if ($b64 === false) {
        return false;
    }
    $url = strtr($b64, "+/", "-_");
    return rtrim($url, "=");
}

function der_unpacking($der) {
    $components = [];
    $pos = 0;
    $size = strlen($der);
    while ($pos < $size) {
        $constructed = (ord($der[$pos]) >> 5) & 0x01;
        $type = ord($der[$pos++]) & 0x1f;
        $len = ord($der[$pos++]);
        if ($len & 0x80) {
            $n = $len & 0x1f;
            $len = 0;
            while ($n-- && $pos < $size) {
                $len = ($len << 8) | ord($der[$pos++]);
            }
        }

        if ($type == 0x03) {
            $pos++;
            $components[] = substr($der, $pos, $len - 1);
            $pos += $len - 1;
        } elseif (!$constructed) {
            $components[] = substr($der, $pos, $len);
            $pos += $len;
        }
    }
    foreach ($components as &$c) {
        $c = str_pad(ltrim($c, "\x00"), 32, "\x00", STR_PAD_LEFT);
    }

    return implode("", $components);
}

function call_api($method, $url, $headers, $data) {
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

    switch ($method) {
        case "POST":
            curl_setopt($curl, CURLOPT_POST, 1);
            break;
        case "PUT":
        case "DELETE":
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
    }
    if ($data) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
    }
    curl_setopt($curl, CURLOPT_URL, $url);
    if ($headers) {
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
    }
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

    $result = curl_exec($curl);

    curl_close($curl);

    return $result;
}

function create_jwt($config, $content = null, $contentType = null) {
    if (
        !openssl_pkcs12_read(
            base64_decode($config->p12),
            $certInfo,
            $config->password
        )
    ) {
        throw new Exception("Error: Unable to read the cert store.");
    }

    $privateKey = $certInfo["pkey"];
    $cert = $certInfo["cert"];
    if (strpos($cert, "BEGIN") != -1) {
        $cert = explode("\n", $cert);
        $cert = implode("", array_slice($cert, 1, -2));
    } else {
        $cert = str_replace("\n", "", $cert);
    }

    // JWT Header
    $header = json_encode([
        "alg" => "ES256",
        "typ" => "JWT",
        "x5c" => [$cert],
    ]);

    // JWT payload
    $issuedAt = new DateTimeImmutable();
    $expire = $issuedAt->modify("+5 minutes")->getTimestamp();
    $jti = $issuedAt->getTimestamp() . uniqid();
    $payloadData = [
        "exp" => $expire,
        "iat" => $issuedAt->getTimestamp(),
        "nbf" => $issuedAt->getTimestamp(),
        "jti" => $jti,
        "aud" => $config->aud,
        "iss" => $config->iss,
    ];
    $digest = null;
    if ($content != null) {
        $digest = "SHA-256=" . base64_encode(hash("sha256", $content, true));
        $payloadData["signed_headers"] = [
            "digest" => $digest,
            "content-type" => $contentType,
        ];
    }
    $payload = json_encode($payloadData);

    // To sign
    $toSign = base64url_encode($header) . "." . base64url_encode($payload);

    // Sign
    openssl_sign($toSign, $signature, $privateKey, "SHA256");

    // Encode Signature to Base64Url String
    $strSignature = base64url_encode(der_unpacking($signature));

    // Create JWT
    $jwt = "$toSign.$strSignature";

    return (object) ["jwt" => $jwt, "digest" => $digest];
}

// Configurazione
$config = (object) [
    "p12" => "XXX", // Base64 file .p12
    "password" => "XXX", // Password del file .p12
    "aud" => "rentrigov.demo.api", // Per produzione rentrigov.api
    "iss" => "XXX", // Indicare l'identificativo dell'operatore presente nel subject del certificato
    "baseApi" => "https://demoapi.rentri.gov.it", // Per produzione https://api.rentri.gov.it
];

$regId = "XXX"; // Indicare l'identificativo del registro

// Content
$content =  "[{\"riferimenti\": { \"numero_registrazione\": { \"anno\": 2024, \"progressivo\": 1 } }}]"; // Json data (oggetto non valido, verrà ritornato status code 400)	
$contentType = "application/json; charset=utf-8";

// Generazione token JWT
$authJwt = create_jwt($config);
$intJwt = create_jwt($config, $content, $contentType);

// Chiamata API
$res = call_api(
    "POST",
    $config->baseApi . "/dati-registri/v1.0/operatore/$regId/movimenti",
    [
        "Authorization: Bearer " . $authJwt->jwt,
        "Digest: " . $intJwt->digest,
        "Agid-JWT-Signature: " . $intJwt->jwt,
        "Content-Type: " . $contentType,
    ],
    $content
);

?>
```

---

*Ultimo aggiornamento: 13/05/2024*