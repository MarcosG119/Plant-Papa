# Plant Papa

This is an app that allows for you to make a profile search thousands of plants from the trefle API and save them to your account. Once you save the plants, you can save notes, the last date you watered them, and receive care instructions based on data from trefle. If you are unsure what a plant is you can upload an image of the plant using a POST to the PlantNet API and get the name of the plant so you can save it to your garden.

## Technologies Used

API calls were built using NODE, AXIOS, and EXPRESS. The authentication is handled by FIREBASE, the data persistance is handled by FIRESTORE, and deployment is handled by FIREHOST. The frontend was built using REACT and TYPESCRIPT.


## Running the app

1. Clone the repository
2. From the terminal using the node package handler $ npm install
3. $ npm run build
4. $ npm run start
5. To run the backend there is no need to CD into any files to run the server simply run $ node server.js
6. Track your plants!
