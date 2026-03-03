import db from '../db/config.js';

const getData = async (req, res) => {
  await db.read();
  res.status(200).json(db.data);
};

const addData = async (req, res) => {
  await db.read();
  db.data.push({...req.body});
  await db.write();
  res.status(201).json({...req.body});
}

export { getData, addData };
