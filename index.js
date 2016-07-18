"use strict";
console.log("Dynamo DB stress test runner");
console.log('version : ', process.env.npm_package_version);

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
let minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const TABLES = {
	dev: "localAuth",
	prod: "user",
	test: "test_user"
};
global.stage = "test";

const CONDITION = 'attribute_not_exists (email)';
const SIZE = argv.size || argv.s || 1;
const FREQUENCY = argv.frequency || argv.f || 1;

console.log("launching ", SIZE, " at ", FREQUENCY, " request per second");


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
			cb(err);
		} else {
			cb(null, {email: obj.email});
		}
	});
}

function del (obj, cb) {
	const TABLE = TABLES[global.stage];
	dynamo.deleteItem({
		TableName: TABLE,
		Key: obj
	}, function (err) {});
}
var completed = 0;
let times = [];
for (let index = 0; index < SIZE; index++) {
	times[index] = index;
}
const START = process.hrtime();

async.map(times, function (index, callback) {
	let diff = process.hrtime(START);
	let delay = 1000 * (index / FREQUENCY - diff[0]) - Math.floor(diff[1] / 1000000);
	setTimeout(function () {
		let time = process.hrtime();
		create({email: "key"+index, key: "value"}, function () {
			let end = process.hrtime(time);
			completed++;
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write('Percent : ' + Math.floor(completed / SIZE * 100));
			callback(null, 1000000000 * end[0] + end [1]);
			del({email: "key"+index});
		});
	}, delay);
}, function (err, array) {
	var sum = array.reduce(function (p, c) {return p + c;});
	var seconds = Math.floor(sum / 1000000) / 1000;
	console.log("total time : ", seconds);
	console.log("average time : ", seconds / SIZE);
});
