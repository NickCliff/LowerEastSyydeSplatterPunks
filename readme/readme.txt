tiddlywiki

PREDICT
	An implementation of artificial intelligence in retail banking.

--------------------------------------------------------------------------------------

INTRODUCTION
	

--------------------------------------------------------------------------------------

USECASES

1.	Every Friday, John heads to the pub after work, just before doing this he transfers $50 from his pay account into his transaction account, it's not a given and he doesn't want to commit to having a regular transaction occurring weekly. With Predict we attempt to determine that John has logged in purely for this purpose and suggest the transaction to him.

2.	Jane gets paid each Wednesday, she logs in Thursday to transfer monday from the account she gets paid into to repay her credit card, sometimes it's $300, sometimes it's $350. Predict can suggest the transaction and if this week Jane wishes to transfer $400 she can easily hit edit and type in an amended value.
	
	
--------------------------------------------------------------------------------------

INSTALLATION INSTRUCTIONS
1. Install nodejs; http://nodejs.org/
2. Start node server; (command should be: "node ./Server/server.js" in command line)
3. Start apache server;
4. Navigate to http://localhost/TopCoder-1.7/default.html;
5. Select "LESSP-1.7" from the container drop down (should be the first option)

Might need to:
- update line 15 of LESSP.js (./Apps/LESSP-1.7/LESSP.js) to point at location that node server will be running on (should not need to do this step but might have to if local machine is configured differently)

--------------------------------------------------------------------------------------
LIMITATIONS

-- sanitised data (not sure how it was sanitised, could possibly have done more if data included:
	descriptions (unsure if John Smith could manage to spend $2,000 on groceries in one trip to the store as one transaction suggested)
	time of day transaction occurred (they're scrubbed to only show date)

--------------------------------------------------------------------------------------

TECHNOLOGY
- jQuery (Provided)
- HTML (Provided)
- nodejs (Calling Google's prediction algorithm - change calls)
- Google Prediction API (Used for prediction of next transfer)
- Postgres DB (just for inputting into Google)

--------------------------------------------------------------------------------------

THANKS
the Lower East Side Splatter Punks
- Andrew Purchas & Nicholas Cliff

GitHub
https://github.com/tiggert/LowerEastSyydeSplatterPunks
(final of many attempts)