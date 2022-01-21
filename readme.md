# Run 
This is a node utility to help the reanchoring of suppliers to clients in the portals databases.
This is used if a supplier ends up with multiple entities in portals, with the wrong one being anchored to the client.
This will replace the incorrectly anchored supplier with the one which it is supposed to be anchored to, and prefix the name 
of the removed supplier entity with some text to indicate that it is obsolete.

To run:
You will need to have the relevant database credentials, to populate the environment variables:
DB_USER
DB_HOST
DB_NAME
DB_PASSWORD
DB_PORT

Then you can run: `node switch-anchored-supplier.js`

You will be prompted to add a filename. This should point to a json file with details to guide the re-anchoring. It should take a form like this:

```js
[
  {
    "supplierToAnchor": "b81e984a-1f6b-4fc7-a126-83a34393ded8",
    "supplierToUnanchor": "183211e4-86cb-4fd9-89e3-265cc39cbb8f",
    "clientAccountId": "3a76ebdf-3e83-4154-863a-95c38d2622fc",
    "unanchoredNewName": "sx-161"
  }
]

```

*supplierToAnchor* The crm account id of the supplier entity we want to be anchored to the client
*supplierToUnanchor* The crm account id of the supplier entity we want to be disassociated from the client
*clientAccountId* The crm account id of the client entity to have its supplier association changed
*uncanchoredNewName* This will be prefixed onto the disassociated supplier's current name