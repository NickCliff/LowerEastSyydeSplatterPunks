PREDICT
	An implementation of artificial intelligence in retail banking.

--------------------------------------------------------------------------------------

INTRODUCTION
	
Predict is one example of how we can use our current data to better understand and predict our customers future behaviors and needs before they themselves know it. By combining data readily available to us with various machine learning techniques it will help CBA gain a new level of intimacy with our existing customers and offer a more complete well rounded service.

Predict currently works by
Taking a set of data for a certain customer, and uploads this to cloud storage
The data is then passed through to the google prediction / machine learning engine where we perform a time series regression analysis of the data to help predict a transaction for a specified point of time, in our case a specific day
After the models have been trained, we are free to pass it prediction parameters. The flow occurs as such
Client
Node.JS server (hosted on the Windows Azure Cloud Platform)
Google Prediction API
Back through the Server to return a processed result for client consumption

After the above has occurred, we place our client in control, leaving them with the power to accept, reject just this transaction, or to completely ignore future reccomendations. Because this project has been pulled together in a very limited time frame Predict is just one example of the application of machine learning to better understand and service our customers.

--------------------------------------------------------------------------------------
Contents

YourName, 17 September 2012 (created 17 September 2012)
no tags
Brief Notes on Zip File contents
CBA-predict-nodeserver zip
Code for our Node.JS server purely for reference. You don't need to do anything with this as it is running on azure
node-google-prediction zip
prediction library which authenticates on the server and makes calls to prediction engine. Also purely for reference as this is deployed on Azure using NPM.
Screenshots zip
Screen shots of app working
APP/LESSP_1.7
Client side of application - Javascript and HTML

--------------------------------------------------------------------------------------
USECASES

1.	Every Friday, John heads to the pub after work, just before doing this he transfers $50 from his pay account into his transaction account, it's not a given and he doesn't want to commit to having a regular transaction occurring weekly. With Predict we attempt to determine that John has logged in purely for this purpose and suggest the transaction to him.

2.	Jane gets paid each Wednesday, she logs in Thursday to transfer monday from the account she gets paid into to repay her credit card, sometimes it's $300, sometimes it's $350. Predict can suggest the transaction and if this week Jane wishes to transfer $400 she can easily hit edit and type in an amended value.
	
	
--------------------------------------------------------------------------------------

INSTALLATION INSTRUCTIONS
nodeJS Server:
1. Instructions were for installing locally, however this is now hosted on Windows Azure with all dependancies being managed in the cloud by NPM (Node.JS packaged modules) during deployment using git.

Client
3. Start apache server; (apachectl start on mac)
4. Navigate in Chrome to: http://localhost/TopCoder-1.7/default.html;
5. Select LESSP-1.7 from the container drop down (should be the first option)
Might need to:
- update line 15 of LESSP.js (./Apps/LESSP-1.7/LESSP.js) to point at location that node server will be running on (should not need to do this step but might have to if local machine is configured differently)
--------------------------------------------------------------------------------------
LIMITATIONS

sanitised data (not sure how it was sanitised, could possibly have done more if data included:
descriptions (unsure if John Smith could manage to spend $2,000 on groceries in one trip to the store as one transaction (TC188) suggested)
time of day transaction occurred (they're scrubbed to only show date)
Certain days only have a limited number of transactions (i.e. On Thursdays over 2 years John only had 18 transactions total)

--------------------------------------------------------------------------------------

TECHNOLOGY
jQuery (Provided)
HTML (Provided)
nodejs (Calling Google's prediction algorithm - change calls)
Google Prediction API (Used for prediction of next transfer)
Postgres DB (just for inputting into Google, xpath xml queries)
Windows Azure Cloud Platform
Microsoft SQL Server (Switched to this to play nicely with Azure)
Git / Github for not only version control but for deployments too)

--------------------------------------------------------------------------------------
Credits

This project was pulled together from various open source resources where we have used and re-written open source code to fit the purpose of predict. The main credits go to 

Gustavo Machado - Google Big Query Library
We viewed his library for interacting with google big query which helped us understand authentication from Node.JS. We viewed this open source library and re-wrote what we needed to interact with the prediction API from an authentication point of view
Hashish
We used this for hashing together various results on our node.JS server to return one JSONP object with everything we needed to select from the client side

We have given credit where possible to any third party open source libraries or technical input we have used or adapted in the project, as without them our job would be a lot harder. Credit given in readme's, packages, code, anywhere we deemed neccesary.
--------------------------------------------------------------------------------------

THANKS
the Lower East Side Splatter Punks
- Andrew Purchas & Nicholas Cliff

GitHub
https://github.com/tiggert/LowerEastSyydeSplatterPunks
(final of many attempts)