How to prepare the environment.
Prerequirements
Node.js v20.5.1
ionic version 6.20.8
1. Give me your email to send an invite to the repository.
2. Checkout the dev2023 branch of the ionic app repository. In the case of backend
repositories checkout master branch.
3. Create a new branch to work in the new requirement.
4. Edit environments/environment.ts file with the next information.
export const environment = {
 production: false,
 url: 'https://eh-roofing-gateway.herokuapp.com/api',
 // url: 'http://localhost:8080/api'

 /** dropbox keys */
 //appKey:"57lwsplp5auk44k",
 //appSecret:"0nzbfv5z7j5fdin",
 //refreshToken:"Z4H5zFAg7yUAAAAAAAAAAdQOd00n0gisv-6vKvLuQjDpN1-T36joeLqPGaAoeFFe",
 appKey:"bmcndlzkv83uina",
 appSecret:"1gz4tozto32djyr",
 refreshToken: "KcJhVPxutlwAAAAAAAAAAS7xYPGSg8_k9VGlilxNZeDKTCdEHkfa1u68_Vkygmf",
};
5.
6. Run the project with ionic serve (frontend) or tsc & npm run start (backend)
7. Now you can test it in Web.
