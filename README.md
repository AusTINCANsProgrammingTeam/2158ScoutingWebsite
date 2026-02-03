
# 2158 Scouting Website
## Team 2158 ausTIN CAN's Scouting Website
> SASS (Bootstrap), Javascript (Node.js, Express.js, Firebase Node SDK)

  

### Installation
- [Make a firebase project on their website](https://firebase.google.com/docs/web/setup#create-firebase-project-and-app)
- Install [Node.js](https://nodejs.org/en/download) (v24-25 compatible as of 12/20/2025)
- Clone this repository
- Run the following in both `./` and `./functions/`

```bash
npm install
```
- Install Firebase CLI (NPM)
```bash
npm install -g firebase-tools
```
- Follow firebase [hosting guide:](https://firebase.google.com/docs/hosting/quickstart#initialize)
```bash
#Log into firebase
firebase login
#Initialize your project items (hosting, functions)
#	TODO: Run through these steps and add other insights
firebase init hosting
firebase init functions
#Finally deploy
firebase deploy
```
- Make a [firebase real-time database](https://console.firebase.google.com/)
- Update secrets with the url of the database ()
```bash
# Your apikey for cloud functions (Found in the functions page of your cloud console)
firebase functions:secrets:set API_KEY 
# Your database url (Found in the realtime database page of your cloud console)
firebase functions:secrets:sete DATABASE_URL
```
### Usage
TODO: Document how to usage

### Updating
- Start by duplicating `yearConfigBase.js` and renaming it to the current year
- Write each method
- Register the year in `yearConfigRegistry.js`
- Update the year in `loadData.js` and `index.js`

### Docs
- [Getting Started with Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [Getting Started with Express.js](https://expressjs.com/en/starter/installing.html)
- [Getting Started with Bootstrap toolkit](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [Learning SASS/SCSS](https://www.w3schools.com/sass/sass_intro.asp)
- [Firebase Admin SDK](https://firebase.google.com/docs/reference/admin)
- [Firebases Cloud Functions SDK](https://firebase.google.com/docs/functions/)