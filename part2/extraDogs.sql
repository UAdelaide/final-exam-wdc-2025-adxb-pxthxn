INSERT INTO Users (username, email, password_hash, role)
VALUES
('frank123', 'frank@example.com', 'hashed999', 'owner'),
('gina123', 'gina@example.com', 'hashed888', 'owner');

INSERT INTO Dogs (owner_id, name, size)
VALUES
((SELECT user_id FROM Users WHERE username = 'frank123'), 'Buster', 'large'),
((SELECT user_id FROM Users WHERE username = 'frank123'), 'Nala', 'medium'),
((SELECT user_id FROM Users WHERE username = 'gina123'), 'Ziggy', 'small'),
((SELECT user_id FROM Users WHERE username = 'gina123'), 'Shadow', 'large'),
((SELECT user_id FROM Users WHERE username = 'gina123'), 'Peanut', 'small');
