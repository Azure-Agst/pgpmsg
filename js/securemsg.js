// constants
const B64_EMAIL = "bWVAYXp1cmVhZ3N0LmRldg==" // encoded to prevent scraper spam mail
const KEY_ENDPOINT = "https://keys.openpgp.org/vks/v1/by-email/"
var CUR_KEY = null;

// elements
statusTextEl = document.getElementById("status");
textBoxEl = document.getElementById("message");

// functions
async function fetch_key() {
    try {
        const email = atob(B64_EMAIL);
        const url = KEY_ENDPOINT + encodeURIComponent(email);
        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Response status: ${res.status}`);
        }

        CUR_KEY = await res.text();
    } catch (e) {
        console.error(e.message);
        window.alert(
            "An error occurred while attempting to fetch the key from the keyserver. " +
            "Please refresh in a few minutes to try again.\n\n" +
            `${e.message}`
        )
        return null;
    }
}

async function encrypt_msg() {
    console.log(CUR_KEY)
    if (!CUR_KEY) {
        console.error("No key! Can't encrypt!");
        alert("Encryption is not possible without key. Please refresh.")
    }
    const pubKey = await openpgp.readKey({ armoredKey: CUR_KEY });

    const message = await openpgp.createMessage({ text: textBoxEl.value })
    const encrypted = await openpgp.encrypt({
        message: message,
        encryptionKeys: pubKey
    })

    const email = atob(B64_EMAIL);
    const urlEncrypted = encodeURIComponent(encrypted);
    window.location.href = `mailto:${email}?` +
      "subject=PGP%20Encrypted%20Message&" +
      `body=${urlEncrypted}`;
}

// onload
window.onload = async () => {
    statusTextEl.innerHTML = "Fetching Key..."

    await fetch_key();
    if (!CUR_KEY) {
        statusTextEl.innerHTML = "Error! Please refresh!"
        return;
    };

    // oh yeah baby, love functional programming
    const id = CUR_KEY.split("\n")[2]
        .replace("Comment: ", "");
    const fing = CUR_KEY.split("\n")[1]
        .replace("Comment: ", "")
        .replace(/\s/g, "").slice(-16);

    console.log(`Key fetched!\nIdentity: ${id}\nFingerprint: ${fing}`);
    statusTextEl.innerHTML = `Ready! ` +
    `<span class="text-gray-600 dark:text-gray-300">(Fingerprint: ${fing})</span>`
}