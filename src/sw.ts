try {
  chrome.runtime.onMessage.addListener((msg, sender, resp1) => {
    console.log({
      msg,
      sender,
      resp: resp1
    });

    resp1('data');
  });
} catch (e) {

}

