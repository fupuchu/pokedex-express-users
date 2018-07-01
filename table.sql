CREATE TABLE IF NOT EXISTS trainer (
  id SERIAL PRIMARY KEY,
  password_hash varchar(255),
  first_name varchar(255),
  email varchar(255)
);