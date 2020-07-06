export function Base64StringByteSize(base64string) {
    // https://en.wikipedia.org/wiki/Base64#Decoding_Base64_with_padding
    let sub = 0;
    if (base64string.slice(base64string.length-2, 2) == "==") {
        sub = 2;
    } else if (base64string.slice(base64string.length-1, 1) == "=") {
        sub = 1;
    }
    return base64string.length * 3 / 4 - sub;
}


export function makeLinkedSliderDiv(id, label, min, max, val, callback, init_trigger=false) {
    function countDecimals(value) {
        if (Math.floor(value) === value) return 0;
        return value.toString().split(".")[1].length || 0;
    }

    const decimal_places = Math.max(countDecimals(min), countDecimals(max), countDecimals(val));
    const multiplier = 10 ** decimal_places;

    let e_div = createElementWithAttributes("div", {
        id: id,
        class: "linkedslider_div",
    });
    let e_label = createElementWithAttributes("label", {
        class: "linkedslider_label"
    }, label);
    let e_input = createElementWithAttributes("input", {
        type: "range",
        class: "linkedslider_range",
        min: min * multiplier,
        max: max * multiplier,
        value: val * multiplier,
    });
    let e_text = createElementWithAttributes("input", {
        type: "text",
        class: "linkedslider_text",
        value: val,
    })

    e_input.addEventListener("input", function (event) {
        const val = Number(e_input.value) / multiplier;
        updateValue(val, event);
    });
    e_text.addEventListener("input", function(event) {
        const val = Number(e_text.value);
        if (isNaN(val)) {
            e_text.value = e_input.value / multiplier;
        } else {
            updateValue(val, event);
        }
    })

    function updateValue(value, event) {
        value = Math.min(max, Math.max(min, value))
        e_text.value = value;
        e_input.value = value * multiplier;
        callback(value, event);
    }

    if (init_trigger) {
        const val = Number(e_input.value) / multiplier;
        updateValue(val);
    }

    e_div.appendChild(e_label);
    e_div.appendChild(e_input);
    e_div.appendChild(e_text);
    return e_div;
}

export function makeLinkedCheckboxDiv(id, label, checked, callback, init_trigger=false) {
    let e_div = createElementWithAttributes("div", {
        id: id,
        class: "linkedcheckbox_div",
    });
    let e_label = createElementWithAttributes("label", {
        class: "linkedcheckbox_label"
    }, label);
    let e_input = createElementWithAttributes("input", {
        type: "checkbox",
        class: "linkedcheckbox_checkbox",
    });
    if (checked) {
        e_input.checked = true;
    }

    e_input.addEventListener("input", function (event) {
        callback(e_input.checked, event);
    });

    if (init_trigger) {
        callback(e_input.checked);
    }

    e_div.appendChild(e_label);
    e_div.appendChild(e_input);
    return e_div;
}

export function makeLinkedSelectDiv(id, label, choices, callback, init_trigger=false) {
    let e_div = createElementWithAttributes("div", {
        id: id,
        class: "linkedselect_div",
    });
    let e_label = createElementWithAttributes("label", {
        class: "linkedselect_label"
    }, label);
    let e_select = createElementWithAttributes("select", {
        class: "linkedselect_checkbox",
    });
    for (let choice of choices) {
        const e_opt = createElementWithAttributes("option", {value: choice}, choice);
        e_select.appendChild(e_opt);
    }

    e_select.addEventListener("change", function (event) {
        const selected_option = e_select.options[e_select.selectedIndex];
        const selected_value = selected_option.value;
        callback(selected_value, event);
    });

    if (init_trigger) {
        const selected_option = e_select.options[e_select.selectedIndex];
        const selected_value = selected_option.value;
        callback(selected_value);
    }

    e_div.appendChild(e_label);
    e_div.appendChild(e_select);
    return e_div;
}

export function makeLinkedColorDiv(id, label, value, callback, init_trigger=false) {
    let e_div = createElementWithAttributes("div", {
        id: id,
        class: "linkedcolor_div",
    });
    let e_label = createElementWithAttributes("label", {
        class: "linkedcolor_label"
    }, label);
    let e_input = createElementWithAttributes("input", {
        type: "color",
        class: "linkedcolor_color",
        value: value,
    });

    e_input.addEventListener("input", function (event) {
        callback(e_input.value, event);
    });

    if (init_trigger) {
        callback(e_input.value);
    }

    e_div.appendChild(e_label);
    e_div.appendChild(e_input);
    return e_div;
}

/**
 * Returns the angle associated with a slope
 * @param {float} dx
 * @param {float} dy
 */
export function get_angle(dx, dy) {
    if (dx == 0) {
        return dy < 0 ? Math.PI * 3 / 2 : Math.PI / 2;
    }
    if (dy == 0) {
        return dx > 0 ? 0 : Math.PI;
    }
    if (dx >= 0 && dy >= 0) {
        return Math.atan(dy / dx);
    } else if (dx >= 0 && dy < 0) {
        return Math.atan(dy / dx) + Math.PI * 2;
    } else {
        return Math.atan(dy / dx) + Math.PI;
    }
}

function hsv2rgb(h, s, v) {
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }

    return [r, g, b];
}

export function getRandomColorStringHSV(h, s, v) {
    let color = "#";
    if (h == undefined) h = Math.random();
    if (s == undefined) s = Math.random();
    if (v == undefined) v = Math.random();
    let [r, g, b] = hsv2rgb(h, s, v);
    for (let channel of [r, g, b]) {
        color += Math.floor(channel * 255).toString(16).padStart(2, "0");
    }
    return color;
}

export function getRandomColorString() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function smooshArray(arr, min=undefined) {
    if (min == undefined) {
        min = Math.min(...arr);
    }
    let a = arr.map(e => e);
    const sorted = new Set(a.slice().sort())
    for (let rolling_min of sorted) {
        for (let i=0; i<a.length; i++) {
            if (a[i] == rolling_min) {
                a[i] = min;
            }
        }
        min ++;
    }
    return a;
}

export function MinMax(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export function createPicklist(attributes, choices, callback) {
    let s = createElementWithAttributes("select", attributes);
    for (let choice of choices) {
        const c = createElementWithAttributes("option", {value: choice}, choice);
        s.appendChild(c);
    }
    s.addEventListener("change", callback);
    return s;

    /**
     * Example use:
let p = createPicklist({}, ["a", "b", "c"], e => console.log("picked", e.target.value))
document.body.appendChild(p);
     */
}

export function createElementWithAttributes(tagname, attributes={}, innerHTML="") {
/**
 * Returns an element with given tag, attributes, and innerHTML created by document
 */
    let e = document.createElement(tagname);
    for (let key of Object.keys(attributes)) {
        const val = attributes[key];
        e.setAttribute(key, val);
    }
    e.innerHTML = innerHTML;
    return e;
}

export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function short_uuid() {
    return 'xxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}