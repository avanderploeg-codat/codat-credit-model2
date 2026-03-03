import db from "../db/config.js";

const getIndex = async (req, res) => {
  await db.read();

  res.render('index', {
    title: 'Welcome Home',
    users: db.data.map(obj => obj.name)
  });
}

export { getIndex };