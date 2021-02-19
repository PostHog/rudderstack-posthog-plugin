const alias = {
  userId: "properties.alias",
  previousId: ["properties.distinct_id"]
};

const page = {
  name: "properties.name",
  "properties.category": "properties.category",
  "properties.host": "properties.$host",
  "properties.url": "properties.$current_url",
  "properties.path": "properties.$pathname",
  "properties.referrer": "properties.$referrer",
  "properties.initial_referrer": "properties.$initial_referrer",
  "properties.referring_domain": "properties.$referring_domain",
  "properties.initial_referring_domain": "properties.$initial_referring_domain"
};

const identify = {
  "context.traits": "$set",
  traits: "$set"
};

const group = {
  groupId: "groupId",
  traits: "traits"
};

const track = {
  event: "event"
};

// TODO: handle "context.channel" better
const generic = {
  "context.os.name": "properties.$os",
  "context.browser": "properties.$browser",
  "context.page.host": "properties.$host",
  "context.page.url": "properties.$current_url",
  "context.page.path": "properties.$pathname",
  "context.page.referrer": "properties.$referrer",
  "context.page.initial_referrer": "properties.$initial_referrer",
  "context.page.referring_domain": "properties.$referring_domain",
  "context.page.initial_referring_domain":
    "properties.$initial_referring_domain",
  "context.browser_version": "properties.$browser_version",
  "context.screen.height": "properties.$screen_height",
  "context.screen.width": "properties.$screen_width",
  "context.channel": "properties.$lib",
  "context.ip": "ip",
  messageId: "$insert_id",
  originalTimestamp: "sent_at",
  userId: ["$user_id", "distinct_id"],
  anonymousId: [
    "properties.$anon_distinct_id",
    "properties.$device_id",
    "properties.distinct_id"
  ],
  "context.active_feature_flags": "properties.$active_feature_flags",
  "context.posthog_version": "properties.posthog_version",
  "context.has_slack_webhook": "properties.has_slack_webhook",
  "context.token": "properties.token"
};

const autoCapture = {
  event: "properties.$event_type",
  "properties.elements": "properties.$elements"
};

const eventToMapping = {
  $identify: { type: "identify", mapping: identify },
  $create_alias: { type: "alias", mapping: alias },
  $pageview: { type: "page", mapping: page },
  $page: { type: "page", mapping: page },
  $group: { type: "group", mapping: group },
  $autocapture: { type: "track", mapping: autoCapture },
  default: { type: "track", mapping: track }
};

function set(target, path, value) {
  let keys = path.split(".");
  let len = keys.length;

  for (let i = 0; i < len; i++) {
    let prop = keys[i];

    if (!isObject(target[prop])) {
      target[prop] = {};
    }

    if (i === len - 1) {
      result(target, prop, value);
      break;
    }

    target = target[prop];
  }
}

function result(target, path, value) {
  target[path] = value;
}

function isObject(val) {
  return val !== null && (typeof val === "object" || typeof val === "function");
}

function get(target, path, options) {
  if (!isObject(options)) {
    options = { default: options };
  }

  if (!isValidObject(target)) {
    return typeof options.default !== "undefined" ? options.default : target;
  }

  if (typeof path === "number") {
    path = String(path);
  }

  const isArray = Array.isArray(path);
  const isString = typeof path === "string";
  const splitChar = options.separator || ".";
  const joinChar =
    options.joinChar || (typeof splitChar === "string" ? splitChar : ".");

  if (!isString && !isArray) {
    return target;
  }

  if (isString && path in target) {
    return isValid(path, target, options) ? target[path] : options.default;
  }

  let segs = isArray ? path : split(path, splitChar, options);
  let len = segs.length;
  let idx = 0;

  do {
    let prop = segs[idx];
    if (typeof prop === "number") {
      prop = String(prop);
    }

    while (prop && prop.slice(-1) === "\\") {
      prop = join([prop.slice(0, -1), segs[++idx] || ""], joinChar, options);
    }

    if (prop in target) {
      if (!isValid(prop, target, options)) {
        return options.default;
      }

      target = target[prop];
    } else {
      let hasProp = false;
      let n = idx + 1;

      while (n < len) {
        prop = join([prop, segs[n++]], joinChar, options);

        if ((hasProp = prop in target)) {
          if (!isValid(prop, target, options)) {
            return options.default;
          }

          target = target[prop];
          idx = n - 1;
          break;
        }
      }

      if (!hasProp) {
        return options.default;
      }
    }
  } while (++idx < len && isValidObject(target));

  if (idx === len) {
    return target;
  }

  return options.default;
}

function join(segs, joinChar, options) {
  if (typeof options.join === "function") {
    return options.join(segs);
  }
  return segs[0] + joinChar + segs[1];
}

function split(path, splitChar, options) {
  if (typeof options.split === "function") {
    return options.split(path);
  }
  return path.split(splitChar);
}

function isValid(key, target, options) {
  if (typeof options.isValid === "function") {
    return options.isValid(key, target);
  }
  return true;
}

function isValidObject(val) {
  return isObject(val) || Array.isArray(val) || typeof val === "function";
}

async function setupPlugin({ config, global }) {
  console.log("Setting up the plugin!");
  console.log(config);
  const rudderBase64AuthToken = Buffer.from(`${config.writeKey}:`).toString(
    "base64"
  );

  global.rudderAuthHeader = {
    headers: {
      Authorization: `Basic ${rudderBase64AuthToken}`
    }
  };
  global.writeKey = config.writeKey;
  global.dataPlaneUrl = config.dataPlaneUrl;
  global.setupDone = true;
}

async function processEventBatch(events, { config, cache, global }) {
  let rudderEventsArray = [];
  let batch = {};
  events.forEach(pHEvent => {
    console.log(pHEvent);
    let rudderPayload = {};
    // add generic props
    constructPayload(rudderPayload, pHEvent, generic);

    // get specific event props
    let eventName = get(pHEvent, "event");
    let { type, mapping } = eventToMapping[eventName]
      ? eventToMapping[eventName]
      : eventToMapping["default"];

    //set Rudder payload type
    set(rudderPayload, "type", type);
    // set Rudder event props
    constructPayload(rudderPayload, pHEvent, mapping);

    // add all pther posthog keys under props not starting with $ to Rudder payload properties
    Object.keys(pHEvent.properties).forEach(propKey => {
      if (
        propKey.slice(0, 1) != "$" &&
        pHEvent.properties[propKey] != undefined &&
        pHEvent.properties[propKey] != null
      ) {
        set(
          rudderPayload,
          `properties.${propKey}`,
          pHEvent.properties[propKey]
        );
      }
    });

    rudderEventsArray.push(rudderPayload);
  });
  batch.batch = rudderEventsArray;
  batch.sentAt = new Date().toISOString();
  await sendToRudder(global, cache, batch);
  return events;
}

async function sendToRudder(global, cache, batch) {
  let olderBatch, payload;
  try {
    olderBatch = await cache.get(global.writeKey);
    olderBatch = JSON.parse(olderBatch);
    console.log("oldbatch: " + JSON.stringify(olderBatch));
    payload = {
      batch: olderBatch
        ? [...olderBatch.batch, ...batch.batch]
        : [...batch.batch],
      sentAt: new Date().toISOString()
    };
    let res = await fetchWithRetry(
      global.dataPlaneUrl,
      {
        headers: {
          "Content-Type": "application/json",
          ...global.rudderAuthHeader.headers
        },
        body: payload
      },
      "POST"
    );
    console.log(
      "***sending payload to Rudder server gave a response, deleting any cached data******" +
        res.status
    );
    await cache.expire(global.writeKey, 0);
  } catch (err) {
    console.log("fetchWithRetry thrown error: " + err);
    console.log("******storing failed payload in redis*********");
    await cache.set(global.writeKey, JSON.stringify(payload));
  }
}

async function fetchWithRetry(
  url,
  options = {},
  method = "GET",
  isRetry = false
) {
  try {
    console.log("final payload: " + JSON.stringify(options.body));
    const res = await fetch(url, {
      method: method,
      headers: options.headers,
      body: JSON.stringify(options.body)
    });
    console.log("response status: " + res.status);
    const body = await res.text();
    console.log("response: " + res.statusText + " " + body);
    console.log("is response ok: ", res.ok);
    if (!res.ok && isErrorRetryable(res.status)) {
      throw new Error(
        `${method} request to ${url} failed with ${res.status} ${res.statusText}`
      );
    }
    return res;
  } catch (err) {
    console.log("*****request to Rudder server failed*****" + err);
    if (isRetry) {
      throw new Error(`${method} request to ${url} failed.`);
    }
    console.log("*****trying to send payload second time*****");
    const res = await fetchWithRetry(
      url,
      options,
      (method = method),
      (isRetry = true)
    );
    console.log("*****response after second retry*****");
    console.log("response status: " + res.status);
    const body = await res.text();
    console.log("response: " + res.statusText + " " + body);
    return res;
  }
}

function isErrorRetryable(status) {
  if (status >= 500 && status <= 599) {
    return true;
  }
  if (status === 429) {
    return true;
  }
  return false;
}

function constructPayload(outPayload, inPayload, mapping) {
  Object.keys(mapping).forEach(rudderKeyPath => {
    let pHKeyPath = mapping[rudderKeyPath];
    let pHKeyVal = undefined;
    if (Array.isArray(pHKeyPath)) {
      for (let i = 0; i < pHKeyPath.length; i++) {
        pHKeyVal = get(inPayload, pHKeyPath[i]);
        if (pHKeyVal) {
          break;
        }
      }
    } else {
      pHKeyVal = get(inPayload, pHKeyPath);
    }
    console.log("trying to " + rudderKeyPath + " " + pHKeyVal);
    if (pHKeyVal != undefined && pHKeyVal != null) {
      set(outPayload, rudderKeyPath, pHKeyVal);
    }
  });
}

module.exports = {
  setupPlugin,
  processEventBatch
};
