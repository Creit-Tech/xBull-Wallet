try {
  chrome.runtime.onMessage.addListener((msg, sender, resp) => {
    console.log({
      msg,
      sender,
      resp
    });

    resp('data')
  })
} catch (e) {

}
