const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dpPath = path.join(__dirname, `userData.db`);

let db = null;
const installDatabase = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
installDatabase();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const lengthPassword = password.length;
    if (lengthPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `
            INSERT INTO 
          user (username, name, password, gender, location) 
        VALUES 
           (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
      const dbResponse = await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userData = `
       SELECT 
          * 
        FROM 
        user
        WHERE username='${username}';
    `;
  const dpResponse = await db.get(userData);
  if (dpResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordHashed = await bcrypt.compare(password, dpResponse.password);
    if (passwordHashed === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userData = `SELECT 
      * 
    FROM 
    user 
    WHERE username = '${username}';`;
  const responseData = await db.get(userData);
  if (responseData === undefined) {
      response.status(400);
      response.send("Invalid user");
  } else {
    const responsePut = await bcrypt.compare(
      oldPassword,
      responseData.password
    );
    if (responsePut === true) {
      const lengthPassword = newPassword.length;
      if (lengthPassword < 5) {
          response.status(400);
          response.send("Password is too short");
      } else {
        const responseNewPassword = await bcrypt.hash(newPassword, 10);
        const dataUpdate = `
               UPDATE user 
               SET 
               password='${responseNewPassword}'
               WHERE username='${username}';`;
        await db.run(dataUpdate);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
