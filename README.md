
A simple script to export all wiki pages and their attachments of a Redmine server.

## Requirements:

* Node version 22 or higher

## Getting started

Install the dependencies:

```
npm install
```

Create a ```config.json``` file, containing the following properties:

```
cp config.json.dist config.json
```

* ```redmineUrl``` _(required)_: the url of the Redmine server ;
* ```user```: the username used to authenticate through the Redmine REST API ;
* ```password```: the password used to authenticate through the Redmine REST API ;
* ```output```: the path of the local folder that will be used to store the output files ;
* ```insecure```: set this option to ```true``` to run the script in an insecure mode that will not try to validate the SSL certificate of the Redmine server ;
* ```extension```: (default "md") extension of output files ("md" or "textile") ;
* ```excludedProjects```: array of string excluded projects.

Run the script:

```
node main.js
```
