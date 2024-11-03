CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE accounts (
	id			  		VARCHAR(30)		UNIQUE PRIMARY KEY NOT NULL,
	email	    		VARCHAR(255)	UNIQUE NOT NULL,
	username 			VARCHAR(30)		NOT NULL,
	bio					VARCHAR(128)	DEFAULT '',
	password    		VARCHAR(255)	NOT NULL,
	avatar				TEXT			DEFAULT '',
	banner				TEXT			DEFAULT '',
	created_at			TIMESTAMP		NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_status			SMALLINT		NOT NULL DEFAULT 0,
	last_note			VARCHAR(255)	DEFAULT '',
	last_note_d			TIMESTAMP		DEFAULT CURRENT_TIMESTAMP,
	dm_option			SMALLINT		NOT NULL DEFAULT 0,
	filter_option		SMALLINT		NOT NULL DEFAULT 0,
	last_data_req		TIMESTAMP
);

CREATE TABLE posts (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	text				VARCHAR(50)		NOT NULL DEFAULT '',
	attachment			TEXT			NOT NULL,
	posted_at			TIMESTAMP		NOT NULL DEFAULT CURRENT_TIMESTAMP,
	profile_id			VARCHAR(30)		REFERENCES accounts(id)
);

CREATE TABLE private_rooms (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	last_message_at		TIMESTAMP
);

CREATE TABLE private_messages_users (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	profile_id			VARCHAR(30)		REFERENCES accounts(id),
	room_id				UUID			REFERENCES private_rooms(id)
);

CREATE TABLE private_messages (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	content				TEXT			NOT NULL,
	created_at			TIMESTAMP		NOT NULL DEFAULT CURRENT_TIMESTAMP,
	attachments			TEXT[],
	spotify_embeds		TEXT[],
	tenor_urls			TEXT[],
	post_id				UUID			REFERENCES posts(id),
	reply_id			UUID			REFERENCES private_messages(id),
	profile_id			VARCHAR(30)		REFERENCES accounts(id),
	dm_id				UUID			REFERENCES private_rooms(id)
);

CREATE TABLE servers (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	name				VARCHAR(30)		NOT NULL,
	avatar				TEXT			NOT NULL DEFAULT '',
	banner				TEXT			NOT NULL DEFAULT '',
	invite				CHAR(8)			NOT NULL,
	invites_disabled	BOOLEAN			NOT NULL DEFAULT false,
	created_at			TIMESTAMP		NOT NULL DEFAULT CURRENT_TIMESTAMP,
	owner_id			VARCHAR(30)		REFERENCES accounts(id)
);

CREATE TABLE channels (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	name				VARCHAR(20)		NOT NULL,
	description			TEXT			DEFAULT '',
	created_at			TIMESTAMP		NOT NULL DEFAULT CURRENT_TIMESTAMP,
	server_id			UUID			REFERENCES servers(id)
);

CREATE TABLE roles (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	name				VARCHAR(20)		NOT NULL,
	hex_color			VARCHAR(8)		NOT NULL,
	created_at			TIMESTAMP		NOT NULL DEFAULT CURRENT_TIMESTAMP,
	server_id			UUID			REFERENCES servers(id)
);

CREATE TABLE member_messages (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	content				TEXT			NOT NULL,
	created_at			TIMESTAMP		NOT NULL DEFAULT CURRENT_TIMESTAMP,
	attachments			TEXT[],
	spotify_embeds		TEXT[],
	tenor_urls			TEXT[],
	reply_id			UUID			REFERENCES private_messages(id),
	profile_id			VARCHAR(30)		REFERENCES accounts(id),
	channel_id			UUID			REFERENCES channels(id),
	server_id			UUID			REFERENCES servers(id)
);

CREATE TABLE member_roles (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	assigned_at			TIMESTAMP		DEFAULT CURRENT_TIMESTAMP,
	profile_id  		VARCHAR(30)		REFERENCES accounts(id),
	role_id				UUID			REFERENCES roles(id),
	server_id	  		UUID			REFERENCES servers(id)
);

CREATE TABLE member_servers (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	server_username		VARCHAR(30)		DEFAULT '',
	server_avatar		TEXT			DEFAULT '',
	joined_at			TIMESTAMP		DEFAULT CURRENT_TIMESTAMP,
	profile_id  		VARCHAR(30)		REFERENCES accounts(id),
	server_id	  		UUID			REFERENCES servers(id)
);

CREATE TABLE member_servers_banned (
	id          		UUID 			PRIMARY KEY DEFAULT uuid_generate_v4(),
	banned_at			TIMESTAMP		DEFAULT CURRENT_TIMESTAMP,
	profile_id  		VARCHAR(30)		REFERENCES accounts(id),
	server_id	  		UUID			REFERENCES servers(id)
);
