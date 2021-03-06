var express = require('express'),
  router = express.Router(),
  request = require('request'),
  message = require('./message');

/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */


const FACEBOOK_VALIDATION_TOKEN = process.env.FACEBOOK_VALIDATION_TOKEN;

router.get('/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === FACEBOOK_VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
router.post('/', function(req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(event) {
        if (event.optin) {
          message.receivedAuthentication(event);
        } else if (event.message) {
          message.receivedMessage(event);
        } else if (event.delivery) {
          message.receivedDeliveryConfirmation(event);
        } else if (event.postback) {
          message.receivedPostback(event);
        } else if (event.read) {
          message.receivedMessageRead(event);
        } else if (event.account_linking) {
          message.receivedAccountLink(event);
        } else {
          console.log("Webhook received unknown messagingEvent: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});



module.exports = router