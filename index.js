"use strict";
console.log("Dynamo stress test runner");
if (!process.env.AWS_ACCESS_KEY_ID) {
	throw new Error('Missing environment variable : AWS_ACCESS_KEY_ID');
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
	throw new Error('Missing environment variable : AWS_SECRET_ACCESS_KEY');
}
if (!process.env.AWS_REGION) {
	throw new Error('Missing environment variable : AWS_REGION');
}

let doc = require('dynamodb-doc');
let dynamo = new doc.DynamoDB();
let async = require('async');

const TABLES = {
dev: "localAuth",
     prod: "user",
     test: "test_user"
};
global.stage = "test";

const CONDITION = 'attribute_not_exists (email)';
const SIZE = 1000;
const LIMIT = 5;

var getType = function (elem) {
	return Object.prototype.toString.call(elem).slice(8, -1);
};

function get (obj, cb) {
	const TABLE = TABLES[global.stage];
	dynamo.getItem({
TableName: TABLE,
Key: {
email: obj.credentials.email
}
}, function (err, data) {
if (err) {
return cb(errors.internal('dynamo Access', err));
}
if ('Item' in data) {
obj.credentials.hash = data.Item.hash;
return cb(null, obj);
}
return cb(errors.notFound('email', obj.credentials.email));
});
}

function create (obj, cb) {
	const TABLE = TABLES[global.stage];
	dynamo.putItem({
		TableName: TABLE,
	Item: obj,
	ConditionExpression: CONDITION
}, function (err) {
if (err) {
	cb(errors.dynamo.create(err, CONDITION));
} else {
cb(null, {email: obj.email});
}
});
}
let times = [];
for (let index = 0; index < SIZE; index++) {
	times[index] = index;
}
async.mapLimit(times, LIMIT, function (index) {

	

}, function (err, array) {});
