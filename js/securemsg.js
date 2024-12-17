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

        const key = await res.text();
        const id = key.split("\n")[2].replace("Comment: ", "")
        const fing = key.split("\n")[1].replace("Comment: ", "")
        console.log(`Key fetched!\nIdentity: ${id}\nFingerprint: ${fing}`);

        return key;
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
    CUR_KEY = await fetch_key();
    if (!CUR_KEY) {
        statusTextEl.innerHTML = "Error! Please refresh!"
        return;
    };
    statusTextEl.innerHTML = "Ready!"
}