# WT Write API

[![Greenkeeper badge](https://badges.greenkeeper.io/windingtree/wt-write-api.svg)](https://greenkeeper.io/)

API server written in node.js to interact with the Winding Tree
platform. It is capable of:

- Create new hotels in WT
- Update existing hotel records
- Delete hotels from WT

It also automatically publishes notifications about changes via
the WT Update API.

## Requirements
- Nodejs >=10

## Getting started
In order to install and run tests, we must:
```
git clone git@github.com:windingtree/wt-write-api.git
nvm install
npm install
npm test
```

### Running dev mode
With all the dependencies installed, you can start the dev server.

First step is to initialize the SQLite database used to store your settings.
If you want to use a different database, feel free to change the connection
settings in the appropriate configuration file in `src/config/`.
```bash
npm run createdb-dev
```

If you'd like to start fresh later, just delete the `.dev.sqlite` file.

Second step is starting Ganache (local Ethereum network node). You can skip this
step if you have a different network already running.
```bash
npm run dev-net
```

For trying out the interaction with the running dev-net and wt-write-api in general,
you can use the Winding Tree demo wallet protected by password `windingtree`.
It is initialized on `dev-net` with enough ether. For sample interaction scripts, check out our
[Developer guides](https://github.com/windingtree/wiki/tree/master/developer-guides).

**!!!NEVER USE THIS WALLET FOR ANYTHING IN PRODUCTION!!!** Anyone has access to it.

```js
{"version":3,"id":"7fe84016-4686-4622-97c9-dc7b47f5f5c6","address":"d037ab9025d43f60a31b32a82e10936f07484246","crypto":{"ciphertext":"ef9dcce915eeb0c4f7aa2bb16b9ae6ce5a4444b4ed8be45d94e6b7fe7f4f9b47","cipherparams":{"iv":"31b12ef1d308ea1edacc4ab00de80d55"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"d06ccd5d9c5d75e1a66a81d2076628f5716a3161ca204d92d04a42c057562541","n":8192,"r":8,"p":1},"mac":"2c30bc373c19c5b41385b85ffde14b9ea9f0f609c7812a10fdcb0a565034d9db"}};
```

Now we can run our dev server.
```bash
npm run dev
```

When using a `dev` config, we internally run a script to deploy WT Index. It is not immediate,
so you might experience some errors in a first few seconds. And that's the reason why
it is not used in the same manner in integration tests.

You can fiddle with the configuration in `src/config/`.


### Running node against Ropsten testnet contract

- To make trying out the node even simpler, we prepared a Docker image pre-configured
to talk with one of our testing contracts deployed on Ropsten. This is currently pinned
to SQLite database. You can skip database setup during the container startup with `SKIP_DB_SETUP`
environment variable.
- You can use it in your local environment by running the following commands:
```sh
$ docker build -t windingtree/wt-write-api .
$ docker run -p 8080:8000 -e WT_CONFIG=playground windingtree/wt-write-api
```
- After that you can access the wt-write-api on local port `8080`
- This deployment is using a Ropsten configuration that can be found in `src/config/playground`
- **Warning** - User wallets (although protected by password) will be stored in the image,
be careful where your API is running and who can access it.
- **Warning** - Once your docker container (and its associated volumes, if any) is deleted,
all accounts (wallets and configuration) will disappear.

## Examples

### Account setup

In order to use the API, you need to create an account that stores your configuration.
The account consists of Ethereum wallet in JSON format and a configuration of uploaders.
The uploaders are telling the API where to put data about hotels managed by that
Ethereum wallet. *The API does not store Wallet passwords.*

The JSON-format wallet can easily be created locally with [mycrypto](https://download.mycrypto.com/).

In this case, we are setting up swarm as our preferred storage, make sure it is 
actually accessible (via the `swarmProvider` gateway url from config) before you
try to create hotel.

```json
{
  "wallet": {"version":3,"id":"7fe84016-4686-4622-97c9-dc7b47f5f5c6","address":"d037ab9025d43f60a31b32a82e10936f07484246","crypto":{"ciphertext":"ef9dcce915eeb0c4f7aa2bb16b9ae6ce5a4444b4ed8be45d94e6b7fe7f4f9b47","cipherparams":{"iv":"31b12ef1d308ea1edacc4ab00de80d55"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"d06ccd5d9c5d75e1a66a81d2076628f5716a3161ca204d92d04a42c057562541","n":8192,"r":8,"p":1},"mac":"2c30bc373c19c5b41385b85ffde14b9ea9f0f609c7812a10fdcb0a565034d9db"}},
  "uploaders": {
    "root": {
      "swarm": {}
    }
  }
}
```

```sh
$ curl -X POST localhost:8000/accounts -H 'Content-Type: application/json' --data @create-account.json

# These values are generated and will be different
{"accountId":"aa43edaf8266e8f8","accessKey":"usgq6tSBW+wDYA/MBF367HnNp4tGKaCTRPy3JHPEqJmFBuxq1sA7UhFOpuV80ngC"}
```

#### Uploaders

We currently support two types of uploaders, and each uploader can contain a
configuration. *These configuration values are not encrypted in any way.*

- **Swarm** - No configuration needed, we will use the Swarm gateway configured
for the whole wt-write-api instance and reasonable defaults for timeout. Timeouts
are in milliseconds. You can override these settings with:
  - `providerUrl` - address of a Swarm gateway. Mandatory.
  - `timeout` - General timeout. Will be used for both read and write.
  - `timeoutRead` - Read timeout, overwrites the general timeout.
  - `timeoutWrite` - Write timeout, overwrites the general timeout.
- **AWS S3** - We recommend to use a separate IAM account for this with a limited
set of permissions. All of the following options are required unless stated
otherwise.
    - `accessKeyId` - AWS credentials
    - `secretAccessKey` - AWS credentials
    - `region` - AWS region
    - `bucket` - S3 bucket to upload to. This is the name that is used in URL.
    - `keyPrefix` - a prefix ("directory") to upload hotel data to. Serves to
    differentiate between different hotels stored in the same s3 bucket. Optional.

You can use any combination of these uploaders for the following list of objects:

- `root` - `Hotel data index` object. This object is required.
- `description` - `Hotel description` object
- `ratePlans` - `RatePlans` object
- `availability` - `Availability` object
...

If you, for example, would like to store your description on Swarm, but everything else in your S3,
you would use the following account object for your initial `POST` request. For any object type not
explicitely stated in the configuration, the `root` configuration will be used.

```json 
{
  "wallet": {"....": "...."},
  "uploaders": {
    "root": {
      "s3": {
        "accessKeyId": "AX...",
        "secretAccessKey": "1234...",
        "region": "eu-west-1",
        "bucket": "hotel-data"
      }
    },
    "description": {
      "swarm": {
        "providerUrl": "https://swarm-gateways.net",
        "timeout": 3000,
        "timeoutRead": 5000,
        "timeoutWrite": 7000
      }
    }
  }
}
```

In another example, you want everything on swarm except `availability` and ratePlans:

```json 
{
  "wallet": {"....": "...."},
  "uploaders": {
    "root": {
      "swarm": {}
    },
    "availability": {
      "s3": {
        "accessKeyId": "AX...",
        "secretAccessKey": "1234...",
        "region": "eu-west-1",
        "bucket": "hotel-data"
      }
    },
    "ratePlans": {
      "s3": {
        "accessKeyId": "AX...",
        "secretAccessKey": "1234...",
        "region": "eu-west-1",
        "bucket": "hotel-data"
      }
    }
  }
}
```
### Create hotel

This is just an example data that we know will pass all the validations. For a better
description of the actual data model, have a look at `src/services/validators/`,
where you will find JSON schemas used to validate incoming data.

```json
{
  "description": {
    "name": "Random hotel",
    "description": "**Beautiful** hotel located in the center of _Prague, Czech Republic_.",
    "location": {
      "latitude": 50.075388,
      "longitude": 14.414170
    },
    "contacts": {
      "general": {
        "email": "chadima.jiri@gmail.com",
        "phone": "00420224371111",
        "url": "https://jirkachadima.cz",
        "ethereum": "windingtree.eth"
      }
    },
    "address": {
      "line1": "Rašínovo nábřeží 1981/80",
      "line2": "Nové Město",
      "postalCode": "12000",
      "city": "Prague",
      "country": "CZ"
    },
    "timezone": "Europe/Prague",
    "currency": "CZK",
    "amenities": [],
    "images": [
      "https://raw.githubusercontent.com/windingtree/media/master/logo-variants/tree/png/tree--gradient-on-white.png",
      "https://raw.githubusercontent.com/windingtree/media/master/logo-variants/full-logo/png/logo--black-on-green.png"
    ],
    "updatedAt": "2018-06-19T15:53:00+0200",
    "defaultCancellationAmount": 30,
    "roomTypes": {
      "1234-abcd": {
        "name": "string",
        "description": "string",
        "totalQuantity": 0,
        "occupancy": {
          "min": 1,
          "max": 3
        },
        "amenities": [
          "TV"
        ],
        "images": [
          "https://raw.githubusercontent.com/windingtree/media/web-assets/logo-variants/full-logo/png/logo--white.png"
        ],
        "updatedAt": "2018-06-27T14:59:05.830Z",
        "properties": {
          "nonSmoking": "some"
        }
      }
    }
  }
}
```

```sh
$ curl -X POST localhost:8000/hotels -H 'Content-Type: application/json' \
  -H 'X-Access-Key: usgq6tSBW+wDYA/MBF367HnNp4tGKaCTRPy3JHPEqJmFBuxq1sA7UhFOpuV80ngC' \
  -H 'X-Wallet-Password: windingtree' \
  --data @hotel-description.json

# This value will be different
{"address":"0xA603FF7EA9A1B81FB45EF6AeC92A323a88211f40"}
```

You can verify that the hotel data was saved by calling
```sh
$ curl localhost:8000/hotels/0xa8c4cbB500da540D9fEd05BE7Bef0f0f5df3e2cc
```

### Update hotel

You can also update previously created hotels. The top-level
properties (e.g. `description`) are always replaced as a whole.

```json
{
  "description": {
    "name": "Changed hotel name",
    "description": "**Beautiful** hotel located in the center of _Prague, Czech Republic_.",
    "location": {
      "latitude": 50.075388,
      "longitude": 14.414170
    },
    "contacts": {
      "general": {
        "email": "chadima.jiri@gmail.com",
        "phone": "00420224371111",
        "url": "https://jirkachadima.cz",
        "ethereum": "windingtree.eth"
      }
    },
    "address": {
      "line1": "Rašínovo nábřeží 1981/80",
      "line2": "Nové Město",
      "postalCode": "12000",
      "city": "Prague",
      "country": "CZ"
    },
    "timezone": "Europe/Prague",
    "currency": "CZK",
    "amenities": [],
    "images": [
      "https://raw.githubusercontent.com/windingtree/media/master/logo-variants/tree/png/tree--gradient-on-white.png",
      "https://raw.githubusercontent.com/windingtree/media/master/logo-variants/full-logo/png/logo--black-on-green.png"
    ],
    "updatedAt": "2018-06-19T15:53:00+0200",
    "defaultCancellationAmount": 30,
    "roomTypes": {
      "1234-abcd": {
        "name": "string",
        "description": "string",
        "totalQuantity": 0,
        "occupancy": {
          "min": 1,
          "max": 3
        },
        "amenities": [
          "TV"
        ],
        "images": [
          "https://raw.githubusercontent.com/windingtree/media/web-assets/logo-variants/full-logo/png/logo--white.png"
        ],
        "updatedAt": "2018-06-27T14:59:05.830Z",
        "properties": {
          "nonSmoking": "some"
        }
      }
    }
  }
}
```

```sh
$ curl -X PATCH localhost:8000/hotels -H 'Content-Type: application/json' \
  -H 'X-Access-Key: usgq6tSBW+wDYA/MBF367HnNp4tGKaCTRPy3JHPEqJmFBuxq1sA7UhFOpuV80ngC' \
  -H 'X-Wallet-Password: windingtree' \
  --data @hotel-description.json
```

The data format version indicator in hotel data index is
always updated to the write api's declared data format version,
no matter how many parts of a hotel you update.

## Publicly available instances

For currently available public instances of wt-write-api, please see [this
page](https://github.com/windingtree/wiki/blob/master/developer-resources.md#publicly-available-wt-deployments).
