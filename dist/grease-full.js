//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate, context) {
    predicate = lookupIterator(predicate);
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate.call(context, elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

/**
 * 2D animation framework for HTML canvas
 * @file grease.js
 * @requires underscore.js
 * @author charliehw
 * @version 0.0.1
 * @license MIT
 * @todo Gradient materials
 * @todo Transformation - rotation, proper scaling
 * @todo Sprites - custom frames and sequences
 * @todo Dirty flags - no need to calculate the absolute transform for a shape that hasn't changed since the last frame
 * @todo Optimise event checking by just working out what the mouse is interacting with each frame, rather than checking on every mouse event (thanks Toby)
 */

(function (root, factory) {
 
    // Environment setup taken from Backbone.js
    // Start with AMD
    if (typeof define === 'function' && define.amd) {

        define(['underscore', 'exports'], function (_, exports) {
            root.grease = factory(root, exports, _);
        });
 
    // Next for Node.js or CommonJS
    } else if (typeof exports !== 'undefined') {

        var _ = require('underscore');
        factory(root, exports, _);

    // Finally, as a browser global
    } else {

        /**
         * @namespace grease
         */
        root.grease = factory(root, {}, root._);

    }

}(this, function (root, grease, _) {

'use strict';

var doc = root.document,
    math = root.Math,
    date = root.Date;


grease.version = '0.0.1';


/**
 * Shim for requestAnimationFrame
 */
root.requestAnimationFrame = (function () {
    return root.requestAnimationFrame || root.webkitRequestAnimationFrame || root.mozRequestAnimationFrame || function (callback) {
        root.setTimeout(callback, 1000 / 60);
    };
}());
/**
 * Basic subclass drawable shape
 * @constructor
 * @param opts
 * @param {number} [opts.x=0] Horizontal position
 * @param {number} [opts.y=0] Vertical position
 * @param {number} [opts.scale=1]
 * @param {number} [opts.rotation=0]
 * @param {boolean} [opts.static=false]
 * @param {grease.Material} [opts.material=grease.defaultMaterial]
 */
grease.Shape = function (opts) {

    this.renderFlag = true;
    this.material = opts.material || grease.defaultMaterial;

    this.transform = {
        position: grease.util.vector(opts.x || 0, opts.y || 0),
        scale: _.isUndefined(opts.scale) ? 1 : opts.scale,
        rotation: opts.rotation || 0
    };

    // opt.static = false stops the shape or group from being checked for events at all
    // If it's a group, no shapes within the group will be checked either
    this.registerEvents = !opts.static;

    // Container for event handlers
    this.handlers = {};

    // States used by the event manager for mouseover mouseout
    this.states = {
        mousedover: false
    };

    // Updates used for animation
    this.updateQueue = [];

};

_.extend(grease.Shape.prototype, {

    /**
     * Reference to constructor
     * @memberof grease.Shape#
     */
    constructor: grease.Shape,

    /**
     * Apply the material to the canvas, called whilst the shape being rendered
     * @memberof grease.Shape#
     * @param context
     * @param transform
     * @param {number} transform.scale
     * @returns {grease.Shape}
     */
    applyMaterial: function (context, transform) {
        var mat = this.material;
        if (mat.fillStyle && !this.isOutline) {
            context.fillStyle = mat.fillStyle;
            context.fill();
        }

        context.lineWidth = mat.lineWidth * transform.scale;

        if (mat.lineCap) {
            context.lineCap = mat.lineCap;
        }
        if (mat.strokeStyle) {
            context.strokeStyle = mat.strokeStyle;
            context.stroke();
        }
        return this;
    },

    /**
     * Defines an event handler
     * @memberof grease.Shape#
     * @param {string} types - Event types to listen for, space delimited
     * @param {function} handler
     * @returns {grease.Shape}
     */
    on: function (types, handler) {
        _.each(types.split(' '), function (type) {
            if (this.handlers[type]) {
                this.handlers[type].push(handler);
            } else {
                this.handlers[type] = [handler];
            }
        }, this);
        return this;
    },

    /**
     * Removes an event handler
     * @memberof grease.Shape#
     * @param {string} [types] - Removes handlers for event types, space delimited
     * @param {function} [handler] - Removes a specific handler for a specific event
     * @returns {grease.Shape}
     */
    off: function (types, handler) {
        if (types) {
            _.each(types.split(' '), function (type) {
                if (this.handlers[type]) {
                    if (handler) {
                        // If handler is included, remove only that handler
                        this.handlers[type] = _.without(this.handlers[type], handler);
                    } else {
                        // Otherwise remove all handlers for the specified event
                        this.handlers[type] = null;
                    }
                }
            }, this);
        } else {
            this.handlers = {};
        }
        
        return this;
    },

    /**
     * Calls all handlers for specified event types
     * @memberof grease.Shape#
     * @param {string} types - Event types being triggered, space delimited
     * @param {event} [e]
     * @returns {grease.Shape}
     */
    trigger: function (types, e) {
        _.each(types.split(' '), function (type) {
            _.each(this.handlers[type], function (handler) {
                handler.call(this, e);
            }, this);
        }, this);

        return this;
    },

    /**
     * Test a point against the shape or the bounds set on it
     * @memberof grease.Shape#
     * @param coords
     * @param transform
     * @returns {boolean}
     */
    testBounds: function (coords, transform) {
        // this.registerEvents determines if any checking should take place for this shape at all
        if (this.registerEvents) {
            // Calculate the shape's absolute transform, otherwise this would have to be done in every shape's checkCollision
            transform = this.getAbsoluteTransform(transform);

            // If the shape has a 'bounds' property and it is a valid shape, use that to check for a collision
            if (this.bounds && this.bounds instanceof grease.Shape) {
                return this.bounds.checkCollision(coords, transform);
            } else {
                return this.checkCollision(coords, transform);
            }
        } else {
            return false;
        }
    },

    /**
     * Implemented by subclasses
     * @memberof grease.Shape#
     * @returns {boolean}
     */
    checkCollision: function () {
        return false;
    },

    /**
     * Parent transforms are taken into account to render a shape. This function compounds the parent transform with the shape's transform
     * @memberof grease.Shape#
     * @param transform
     * @returns {object}
     */
    getAbsoluteTransform: function (transform) {
        return {
            position: grease.util.vector(this.transform.position.x + transform.position.x, this.transform.position.y + transform.position.y),
            scale: this.transform.scale * transform.scale,
            rotation: this.transform.rotation + transform.rotation 
        };
    },

    /**
     * Move the shape relative to its current position. Animate if duration supplied
     * @memberof grease.Shape#
     * @param position Vector to move by or line to follow or a function that returns the required options
     * @param {number} [duration] Duration of animated movement
     * @param {function} [easing]
     * @returns {grease.Shape}
     * @throws {TypeError} Position provided is not valid
     */
    move: function (position, duration, easing) {
        if (typeof position === 'function') {
            var options = position.call(this);
            return this.move(options.position, options.duration, options.easing);
        } else if (duration) {
            this.animate({
                position: grease.util.addVectors(this.position(), position)
            }, duration, easing);
        } else if (_.isNumber(position.x) || _.isNumber(position.y)) {
            position.x = position.x || 0;
            position.y = position.y || 0;
            this.position(grease.util.addVectors(this.transform.position, position));
        } else {
            throw new TypeError('Invalid position provided for move operation.');
        }
        return this;
    },

    /**
     * Get or set the position of the shape relative to its group
     * @memberof grease.Shape#
     * @param {number} [position]
     * @param {number} [position.x] Horizontal position to move to or vector
     * @param {number} [position.y] Vertical position to move to
     * @returns {object}
     */
    position: function (position) {
        if (position && _.isNumber(position.x) && _.isNumber(position.y)) {
            this.transform.position = position;
        } else {
            return this.transform.position;
        }
    },

    /**
     * Renders the shape by updating any animations and then drawing it
     * @memberof grease.Shape#
     * @param context
     * @param transform
     * @param {frameInfo} frameInfo
     * @returns {grease.Shape}
     */
    render: function (context, transform, frameInfo) {
        // Apply any active animations
        this.update(frameInfo);

        transform = this.getAbsoluteTransform(transform);
        this.draw(context, transform, frameInfo);

        return this;
    },

    /**
     * Update the shape based on any queued animations
     * @memberof grease.Shape#
     * @param {frameInfo} frameInfo Includes information on the current frame
     * @returns {grease.Shape}
     */
    update: function (frameInfo) {
        if (!this.updateQueue.length) {
            return this;
        }

        var update = this.updateQueue[0],
            newPosition,
            elapsed;

        // If the animation has just started, store the initial transform
        if (update.elapsed === 0) {
            update.initial = {
                position: grease.util.vector(this.transform.position.x, this.transform.position.y)
            };
        }

        if (update.elapsed + frameInfo.elapsed > update.duration) {
            // If the frame overlaps the end of the animation, just do the last bit of the animation
            elapsed = update.duration;
        } else {
            // Otherwise do the whole segment of the animation based on time elapsed from last frame 
            elapsed = update.elapsed;
        }

        if (!update.easing || typeof update.easing !== 'function') {
            update.easing = grease.easing[update.easing] || grease.easing['linear'];
        }


        newPosition = grease.util.vector(
            update.easing(elapsed, update.initial.position.x, update.transform.position.x || 0, update.duration || 1),
            update.easing(elapsed, update.initial.position.y, update.transform.position.y || 0, update.duration || 1)
        );

        update.elapsed += frameInfo.elapsed;

        this.position(newPosition);

        if (update.elapsed >= update.duration) {
            this.updateQueue.splice(0, 1);
        }

        return this;
    },

    /**
     * Add an animation to the shape's queue
     * @memberof grease.Shape#
     * @param transform
     * @param duration
     * @param [easing]
     * @returns {grease.Shape}
     */
    animate: function (transform, duration, easing) {
        this.updateQueue.push({
            transform: transform,
            duration: duration,
            easing: easing,
            elapsed: 0
        });

        return this;
    },

    /**
     * Stop the shape's animation
     * @memberof grease.Shape#
     * @param {boolean} [clearQueue] Determines if the queue of animations should be cleared
     * @param {boolean} [jumpToEnd] Determines if the current animation should be completed instantly or discarded
     * @returns {grease.Shape}
     */
    stop: function (clearQueue, jumpToEnd) {
        if (clearQueue) {
            // Remove all but first update in queue
            this.updateQueue.splice(1, this.updateQueue.length - 1);
        }

        if (jumpToEnd) {
            // Complete the first update immediately
            this.updateQueue[0].duration = 0;
        } else {
            // Remove the first update from the queue
            this.updateQueue.splice(0, 1); 
        }

        return this;
    }

});


/**
 * Extend the base Shape to create a new shape contructor
 * @memberof grease.Shape
 * @static
 * @param prototypeMethods
 * @param staticMethods
 * @returns {function}
 * @example 
 *  var Star = grease.Shape.extend({
 *      constructor: function (opts) {...},
 *      draw: function (context, transform) {...}
 *  });
 */
grease.Shape.extend = function (prototypeMethods, staticMethods) {
    var constructorToBeExtended = this;

    function Contructor() {
        var args = arguments.length ? Array.prototype.slice.call(arguments) : [{}];
        constructorToBeExtended.apply(this, args);
        prototypeMethods.constructor.apply(this, args);
    }

    _.extend(Contructor, {extend: constructorToBeExtended.extend}, staticMethods);

    Contructor.prototype = Object.create(constructorToBeExtended.prototype);
    _.extend(Contructor.prototype, prototypeMethods);

    return Contructor;
};
/**
 * Specifies a group of shapes. Shapes within the group will be positioned and scaled relative to the group
 * @constructor
 * @augments grease.Shape
 * @param opts
 * @see grease.Shape options
 */
grease.Group = grease.Shape.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Group#
     */
    constructor: function () {
        this.shapes = [];
        this.length = 0;
    },

    /**
     * Draw the group of shapes
     * @memberof grease.Group#
     * @param context
     * @param transform
     * @param [transform.position] Position determined by the parent group
     * @param {number} [transform.scale]
     * @param {frameInfo} frameInfo
     * @returns {grease.Group}
     */
    draw: function (context, transform, frameInfo) {
        this.each(function () {
            if (this.renderFlag) {
                this.render(context, transform, frameInfo);
            }
        });

        return this;
    },

    /**
     * Add a shape, group, or array of shapes to a group
     * @memberof grease.Group#
     * @param {(grease.Shape|grease.Shape[])} target
     * @param {number} [zindex]
     * @returns {grease.Group}
     * @throws {TypeError} Only shapes can be added to groups
     */
    add: function (target, zindex) {

        // Expect first argument as array or each argument as individual shape
        var givenShapes = _.isArray(target) ? target : [target];

        _.each(givenShapes, function (shape) {
            if (shape instanceof grease.Shape) {
                // If a zindex is supplied, add the shape or shapes at the supplied index, 
                // pushing forward any shapes already at or above that index
                if (zindex) {
                    this.shapes.splice(zindex++, 0, shape);
                } else {
                    this.shapes.push(shape);                  
                }
            } else {
                throw new TypeError('Attempt to add a non-shape to the group failed.');
            }
        }, this);

        this.length = this.shapes.length;

        return this;
    },

    /**
     * Remove a specified shape from the group
     * @memberof grease.Group#
     * @param {grease.Shape} target
     * @returns {grease.Group}
     */
    remove: function (target) {
        var self = this;

        this.each(function (index, shape) {
            if (target === shape) {
                self.shapes.splice(index, 1);
            }
        });

        this.length = this.shapes.length;

        return self;
    },

    /**
     * Empties the group
     * @memberof grease.Group#
     * @returns {grease.Group}
     */
    empty: function () {
        this.shapes = [];
        this.length = 0;
        return this;
    },

    /**
     * Iterates over the group and calls the function passed to it, supplying shape and index and arguments
     * @memberof grease.Group#
     * @param {function} callback
     * @returns {grease.Group}
     */
    each: function (callback) {
        _.each(this.shapes, function (shape, index) {
            if (shape) {
                callback.call(shape, index, shape);
            }
        });

        return this;
    },

    /**
     * Creates a representation of the event targets to allow for bubbling in nested group structures
     * @memberof grease.Group#
     * @param coords
     * @param transform
     * @returns match
     * @returns {grease.Group} match.group The group that the matching shapes are in
     * @returns {grease.Shape[]} match.shapes The shapes that match the bounds
     */
    checkCollision: function (coords, transform) {
        var test,
            match = {
                group: this,
                shapes: []
            };

        this.each(function () {
            test = this.testBounds(coords, transform);
            if (this instanceof grease.Group) {
                if (test.shapes.length) {
                    // If the tested shape is a group, add the representation so we can bubble later
                    match.shapes.push(test);
                }
            } else {
                if (test) {
                    // Otherwise just add the shape
                    match.shapes.push(this);
                }
                
            }
        });

        return match;
    }

});
/**
 * Represents a scene, managing the canvas, animation, rendering etc.
 * @constructor
 * @augments grease.Group
 * @param {string} selector - Selector for the container DOM node
 * @throws {Error} No container found matching selector
 */
grease.Scene = grease.Group.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Scene#
     */
    constructor: function (selector) {

        this.container = doc.querySelector(selector);

        if (!this.container) {
            throw new Error('No container found matching selector, ' + selector + '. Cannot create scene.');
        }

        this.frameBuffer = new grease.FrameBuffer(this.container);
        this.listener = new grease.Listener(this);

    },

    /**
     * Start the animation loop
     * @memberof grease.Scene#
     * @fires start
     * @returns {grease.Scene}
     */
    start: function () {
        if (!this.animating) {
            this.trigger('start', {type: 'start'});
            this.animating = true;
            this.loop();
        }
        return this;
    },

    /**
     * Pause the animation loop
     * @memberof grease.Scene#
     * @fires stop
     * @returns {grease.Scene}
     */
    stop: function () {
        this.trigger('stop', {type: 'stop'});
        this.animating = false;
        return this;
    },

    /**
     * Internal animation loop
     * @memberof grease.Scene#
     * @fires render
     * @returns {grease.Scene}
     */
    loop: function () {
        var self = this;

        if (self.animating) {
            root.requestAnimationFrame(function () {    
                self.updateFrameInfo();
                self.trigger('render', self.frameInfo);

                self.render(self.frameBuffer.context(), self.transform, self.frameInfo);
                self.frameBuffer.flip();

                self.loop();
            });
        }

        return this;
    },

    /**
     * Update the frame info object
     * @memberof grease.Scene#
     */
    updateFrameInfo: function () {
        var now = date.now();
        if (!this.frameInfo) {
            this.frameInfo = {
                time: now,
                elapsed: 0,
                frame: 0,
                fps: 0
            };
        } else {
            this.frameInfo.elapsed = now - this.frameInfo.time;
            this.frameInfo.time = now;
            this.frameInfo.frame++;
            this.frameInfo.fps = root.parseInt(1000/this.frameInfo.elapsed);
        }
    },

    /**
     * Stop the scene and remove it's canvas
     * @memberof grease.Scene#
     * @returns {grease.Scene}
     */
    destroy: function () {
        this.stop();
        this.frameBuffer.destroy();
        return this;
    }

});
/**
 * Represents a rectangle to be drawn
 * @constructor
 * @augments grease.Shape
 * @param opts Rectangle options
 * @see grease.Shape options
 * @param {number} [opts.width=0] Width
 * @param {number} [opts.height=0] Height
 */
grease.Rectangle = grease.Shape.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Rectangle#
     */
    constructor: function (opts) {
        this.width = opts.width || 0;
        this.height = opts.height || 0;
    },

    /**
     * Draw the rectangle to the scene
     * @memberof grease.Rectangle#
     * @param context
     * @param transform
     * @returns {grease.Rectangle}
     */
    draw: function (context, transform) {
        context.beginPath();
        context.rect(transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);
        context.closePath();
        this.applyMaterial(context, transform);
        return this;
    },

    /**
     * Check if coords land inside the rectangle
     * @memberof grease.Rectangle#
     * @param coords
     * @param transform
     * @returns {boolean}
     */
    checkCollision: function (coords, transform) {
        var insideHorizontally = coords.x >= transform.position.x && coords.x <= transform.position.x + this.width * transform.scale,
            insideVertically = coords.y >= transform.position.y && coords.y <= transform.position.y + this.height * transform.scale;

        return insideHorizontally && insideVertically;
    }

});
/**
 * Represents an arc to be drawn
 * @constructor
 * @augments grease.Shape
 * @param opts Arc options
 * @see grease.Shape options
 * @param {number} opts.radius Radius of the arc
 * @param {number} opts.startAngle Angle to start the arc path from
 * @param {number} opts.endAngle Angle to end the arc path
 * @param {boolean} [opts.direction=false] Draw path counter clockwise?
 */
grease.Arc = grease.Shape.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Arc#
     */
    constructor: function (opts) {
        this.radius = opts.radius;
        this.startAngle = opts.startAngle;
        this.endAngle = opts.endAngle;
        this.direction = opts.direction || false;
    },

    /**
     * Draw the Arc in a context
     * @memberof grease.Arc#
     * @param context
     * @param transform
     * @returns {grease.Arc}
     */
    draw: function (context, transform) {
        context.beginPath();
        context.arc(transform.position.x, transform.position.y, this.radius * transform.scale, this.startAngle, this.endAngle, this.direction);
        context.closePath();
        this.applyMaterial(context, transform);
        return this;
    },

    /**
     * Check if a point is within the Arc
     * @memberof grease.Arc#
     * @param coords
     * @param transform
     * @returns {boolean}
     */
    checkCollision: function (coords, transform) {
        // Check angle is between start and end
        var angle = math.atan2(coords.y - transform.position.y, coords.x - transform.position.x);
        if (angle < 0) {
            angle = (math.PI - angle) + math.PI;
        }

        // Check distance <= radius
        var distance = this.checkDistance(coords, transform);

        return angle >= this.startAngle && angle <= this.endAngle && distance;
    },

    /**
     * Part of the test bounds check for Arcs. Also used by Circles
     * @memberof grease.Arc#
     * @param coords
     * @param transform
     * @returns {boolean}
     */
    checkDistance: function (coords, transform) {
        var distance = math.sqrt(math.pow(coords.x - transform.position.x, 2) + math.pow(coords.y - transform.position.y, 2));
        return distance <= (this.radius + (this.material.lineWidth / 2)) * transform.scale;
    }

});
/**
 * Represents a circle to be drawn - start angle and end angle are automatically set
 * @constructor
 * @augments grease.Arc
 * @param opts Circle options
 * @see grease.Arc options
 */
grease.Circle = grease.Arc.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Circle#
     */
    constructor: function () {
        this.startAngle = 0;
        this.endAngle = math.PI*2;
    },

    /**
     * Simpler version of the arc test bounds
     * @memberof grease.Circle#
     * @param coords
     * @param transform
     * @return {boolean}
     */
    checkCollision: function (coords, transform) {
        return this.checkDistance(coords, transform);
    }

});
/**
 * Forms a line of points. Can include quadratic or bezier curves
 * @constructor
 * @augments grease.Shape
 * @param opts Line options
 * @see grease.Shape options
 * @param {object[]} opts.points Array of points, each should contain x, y and any controlPoints needed for curves
 * @param {boolean} [opts.fill=false] Determines whether or not the area the line surrounds should be filled
 */
grease.Line = grease.Shape.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Line#
     */
    constructor: function (opts) {
        this.isOutline = !opts.fill;
        this.points = opts.points || [];
    },

    /**
     * Add a point or array of points to the line
     * @memberof grease.Line#
     * @param points
     * @returns {grease.Line}
     */
    add: function (points) {
        if (_.isArray(points)) {
            _.each(points, function (point) {
                this.points.push(point);
            }, this);
        } else {
            this.points.push(points);
        }

        return this;
    },

    /**
     * Draw the line to the context
     * @memberof grease.Line#
     * @param context
     * @param transform
     * @returns {grease.Line}
     */
    draw: function (context, transform) {
        context.beginPath();

        _.each(this.points, function (point, index) {
            var p = transform.position;

            // The first point should just be moved to
            if (index === 0) {
                context.moveTo(point.x + p.x, point.y + p.y);
            } else {
                // The other points might be curved to depending on the existence of control points
                if (point.controlPoints) {
                    if (point.controlPoints.length > 1) {
                        context.bezierCurveTo(point.controlPoints[0].x + p.x, point.controlPoints[0].y + p.y, point.controlPoints[1].x + p.x, point.controlPoints[1].y + p.y, point.x + p.x, point.y + p.y);
                    } else {
                        context.quadraticCurveTo(point.controlPoints[0].x + p.x, point.controlPoints[0].y + p.y, point.x + p.x, point.y + p.y);
                    }
                } else {
                    context.lineTo(point.x + p.x, point.y + p.y);
                }
            }
        });

        this.applyMaterial(context, transform);
        return this;
    }

});
/**
 * Loads an image for use in a scene
 * @constructor
 * @augments grease.Rectangle
 * @param opts Image options
 * @see grease.Rectangle options
 * @param {string} opts.src Source path to image
 * @param {number} [opts.width] Display width of image - default is dynamic based on image
 * @param {number} [opts.height] Display height of image - default is dynamic based on image
 */
grease.Image = grease.Rectangle.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Image#
     */
    constructor: function (opts) {
        this.renderFlag = false;

        this.elem = new root.Image();

        this.elem.onload = this.onload.bind(this);
        this.elem.src = opts.src;

        // Where to clip the image if necessary
        this.clip = opts.clip;

    },

    /**
     * Called when the image element is loaded
     * @memberof grease.Image#
     */
    onload: function (e) {
        // If a width and height was not provided, set them to the actual width/height of the image
        this.width = this.width ? this.width : this.elem.width;
        this.height = this.height ? this.height : this.elem.height;

        this.renderFlag = true;
        this.trigger('load', e);
    },

    /**
     * Draw the image to the specified context
     * @memberof grease.Image#
     * @param context
     * @param transform
     * @returns {grease.Image}
     */
    draw: function (context, transform) {
        if (this.clip) {
            context.drawImage(this.elem, this.clip.x, this.clip.y, this.clip.width, this.clip.height, transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);
        } else {
            context.drawImage(this.elem, transform.position.x, transform.position.y, this.width * transform.scale, this.height * transform.scale);                
        }
        return this;
    }

});
/**
 * Represents a sprite
 * @constructor
 * @augments grease.Image
 * @param opts Sprite options
 * @see grease.Image options
 * @param {number} [opts.cols] Number of columns in uniform sprite image
 * @param {number} [opts.rows] Number of rows in uniform sprite image
 * @param {number} [opts.cells] Total number of cells in sprite if rows*cols is not appropriate
 * @param {number} [opts.frames] Manually defined frames if the sprite is not uniform 
 * @param {number} [opts.sequences] Definition of sequences for animating the sprite
 */
grease.Sprite = grease.Image.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Sprite#
     */
    constructor: function (opts) {

        this.rows = opts.rows;
        this.cols = opts.cols;
        this.cells = opts.cells || this.rows * this.cols;

        this.on('load', function () {
            this.width = this.cellWidth = this.width / this.cols;
            this.height = this.cellHeight = this.height / this.rows;
        });

        this.activeCell = 0;

    },

    /**
     * Draw the sprite to the screen
     * @memberof grease.Sprite#
     * @param context
     * @param transform
     * @returns {grease.Sprite}
     */
    draw: function (context, transform) {
        var positionInRow = this.activeCell % this.cols,
            positionInCol = (this.activeCell - positionInRow) / this.cols;

        this.clip = {
            x: positionInRow * this.cellWidth,
            y: positionInCol * this.cellHeight,
            width: this.cellWidth,
            height: this.cellHeight
        };

        grease.Image.prototype.draw.call(this, context, transform);

        return this;
    },

    /**
     * Step the sprite forward to the next cell in the sequence
     * @memberof grease.Sprite#
     * @param {number} [step] Amount to step through the current sequence, default +1
     * @returns {grease.Sprite}
     */
    step: function (step) {
        if (_.isUndefined(step)) {
            step = 1;
        }

        if (this.activeCell + step < 0) {
            this.activeCell = this.cells + 1 + step;
        } else if (this.activeCell + step > this.cells) {
            this.activeCell = (this.activeCell + step) - this.cells;
        } else {
            this.activeCell += step;
        }

        return this;
    },

});
/**
 * Represents text to be drawn to a scene
 * @constructor
 * @augments grease.Shape
 * @param opts Text options
 * @see grease.Shape options
 * @param {string} opts.text Text to be printed
 */
grease.Text = grease.Shape.extend({

    /**
     * Actual constructor implementation
     * @memberof grease.Text#
     */
    constructor: function (opts) {
        this.text = opts.text;
    },

    /**
     * Apply the material to the text and draw to the canvas
     * @memberof grease.Text#
     */
    applyMaterial: function (context, transform) {
        var mat = this.material;
        context.font = this.material.fontSize + 'pt ' + this.material.fontFamily;

        if (mat.fillStyle) {
            context.fillStyle = mat.fillStyle;
            context.fillText(this.text, this.transform.position.x, this.transform.position.y);
        }
        if (mat.lineWidth) {
            context.lineWidth = mat.lineWidth * transform.scale;
        }
        if (mat.lineCap) {
            context.lineCap = mat.lineCap;
        }
        if (mat.strokeStyle) {
            context.strokeStyle = mat.strokeStyle;
            context.strokeText(this.text, this.transform.position.x, this.transform.position.y);
        }
        context.closePath();
    },

    /**
     * Draw the image to the specified context
     * @memberof grease.Text#
     * @param context
     * @param transform
     * @returns {grease.Text}
     */
    draw: function (context, transform) {
        this.applyMaterial(context, transform);
        return this;
    }

});
/**
 * Represents a material, including information on fill and stroke styles
 * @constructor
 * @param opts Material options
 * @param {string} opts.fillStyle
 * @param {string} opts.strokeStyle
 * @param {number} [opts.lineWidth=0]
 * @param {string} opts.lineCap butt|round|square
 * @param {string} opts.fontFamily Font family to use for text, eg. 'Arial'
 * @param {number} opts.fontSize Size of font as a number
 */
grease.Material = function (opts) {
    this.fillStyle = opts.fillStyle;
    this.strokeStyle = opts.strokeStyle;
    this.lineWidth = opts.lineWidth || 0;
    this.lineCap = opts.lineCap;
    this.fontFamily = opts.fontFamily;
    this.fontSize = opts.fontSize;
};

/**
 * Default material for shapes
 */
grease.defaultMaterial = new grease.Material({
    fillStyle: 'rgb(50, 100, 0)',
    strokeStyle: 0,
    lineWidth: 0,
    fontFamily: 'Arial',
    fontSize: 20
});
/**
 * Represents a gradient for use in a material
 * @constructor
 * @param opts - Gradient options
 * @param opts.type - grease.Gradient.RADIAL_GRADIENT|grease.Gradient.LINEAR_GRADIENT
 * @throws {TypeError} Gradient constructor must be provided a valid type
 */
grease.Gradient = function (opts) {
    if (opts.type === grease.Gradient.LINEAR_GRADIENT) {

    } else if (opts.type === grease.Gradient.RADIAL_GRADIENT) {

    } else {
        throw new TypeError('No valid type provided for gradient creation.');
    }
};


grease.Gradient.RADIAL_GRADIENT = 'radial';
grease.Gradient.LINEAR_GRADIENT = 'linear';
/**
 * Manages all the events triggered on the scene
 * @constructor
 * @param {grease.Scene} scene
 */
grease.Listener = function (scene) {
    this.scene = scene;
    this.captureEvents = true;
    this.init();
};

/**
 * List of events being handled by the event manager
 * @memberof grease.Listener
 * @static
 * @enum
 */
grease.Listener.events = {

    MOUSE: [
        'click',
        'mousedown',
        'mouseup',
        'mousemove',
        'dblclick'
    ],

    TOUCH: [
        'touchstart',
        'touchmove',
        'touchend'
    ],

    KEY: [
        'keyup',
        'keydown',
        'keypress'
    ],

    RESIZE: 'resize'
    
};

_.extend(grease.Listener.prototype, {

    /**
     * Reference to constructor
     * @memberof grease.Listener#
     */
    constructor: grease.Listener,

    /**
     * Initialise the event manager, setting a handler on the scene container for all listed event types
     * @memberof grease.Listener#
     */
    init: function () {
        var self = this,
            pointerEvents = grease.Listener.events.MOUSE.concat(grease.Listener.events.TOUCH);

        // Set up event handlers and delegation
        _.each(pointerEvents, function (event) {
            self.scene.container.addEventListener(event, function (e) {
                e.preventDefault();
                if (self.captureEvents) {
                    var greasyEvent = new grease.Event(e);
                    self.findMatches(greasyEvent);
                }            
            });
        });

        // Set up window event handlers for key events
        _.each(grease.Listener.events.KEY, function (event) {
            root.addEventListener(event, function (e) {
                if (self.captureEvents) {
                    self.scene.trigger(event, e);
                }
            });
        });

        self.scene.container.addEventListener(grease.Listener.events.RESIZE, function () {
            self.scene.trigger(grease.Listener.events.RESIZE, {
                type: grease.Listener.events.RESIZE
            });
        });
    },

    /**
     * Find all shapes matching the coordinates of the event and trigger that event on matches
     * @memberof grease.Listener#
     * @param {grease.Event} e
     */
    findMatches: function (e) {
        var matchingShapes = this.scene.testBounds(e, this.scene.transform),
            bubblePath = this.getBubblePath(matchingShapes).reverse(),
            shape;

        // Events on the container should always trigger on the scene, even if no shapes match
        if (!bubblePath.length) {
            bubblePath.push(this.scene);
        }

        for (var index = 0, length = bubblePath.length; index < length && !e.propagationStopped; index++) {
            shape = bubblePath[index];

            if (index === 0) {
                e.target = shape;
            }

            shape.trigger(e.type, e);

            index++;
        }
        
    },

    /**
     * Reformat the matches into an array ordered for bubbling
     * @memberof grease.Listener#
     * @param shape
     * @param [path]
     * @returns {array} - Ordered path of matching shapes
     */
    getBubblePath: function (shape, path) {
        path = path || [];

        if (shape.group) {
            path.push(shape.group);
            if (shape.shapes.length) {
                this.getBubblePath(shape.shapes[shape.shapes.length - 1], path);                 
            }
        } else {
            path.push(shape);
        }

        return path;      
    }

});
/**
 * Custom event wrapper
 * @constructor
 * @param {Event} e
 */
grease.Event = function (e) {

    var touch = e;
    if (e.changedTouches) {
        touch = e.changedTouches[0];
    }

    this.x = touch.clientX;
    this.y = touch.clientY;

    this.originalEvent = e;
    this.type = e.type;
    this.propagationStopped = false;

};

_.extend(grease.Event.prototype, {

    /**
     * Reference to contructor
     * @memberof grease.Event#
     */
    constructor: grease.Event,

    /**
     * Stops propagation of the event
     * @memberof grease.Event#
     */
    stopPropagation: function () {
        this.propagationStopped = true;
    }

});
/**
 * Frame buffer - ensures the scene is rendered to a hidden canvas each frame, which is then shown, therefore preventing partial frames
 * @constructor
 * @param {HTMLElement} container
 */
grease.FrameBuffer = function (container) {

    var first = new grease.Canvas(container, container.clientWidth, container.clientHeight),
        second = new grease.Canvas(container, container.clientWidth, container.clientHeight);

    second.hide();

    this.canvases = [first, second];
    this.visible = 0;
    this.buffer = second;

};

_.extend(grease.FrameBuffer.prototype, {

    /**
     * Reference to the constructor
     * @memberof grease.FrameBuffer#
     */
    constructor: grease.FrameBuffer,

    /**
     * Clear and hide the old frame, show the newly rendered frame
     * @memberof grease.FrameBuffer#
     */
    flip: function () {

        this.buffer = this.canvases[this.visible].hide().clear();
        this.visible = this.visible ? 0 : 1;

        this.canvases[this.visible].show();

    },

    /**
     * Get the context for the currently hidden frame
     * @memberof grease.FrameBuffer#
     * @returns {CanvasContext}
     */
    context: function () {
        return this.buffer.context();
    },

    /**
     * Destroy the frame buffer
     * @memberof grease.FrameBuffer#
     */
    destroy: function () {
        this.canvases[0].destroy();
        this.canvases[1].destroy();
    }

});
/**
 * Represents a canvas element
 * @constructor
 * @param {HTMLElement} container
 * @param {number} width
 * @param {number} height
 */
grease.Canvas = function (container, width, height) {

    this.elem = doc.createElement('canvas');

    this.elem.width = width;
    this.elem.height = height;

    container.appendChild(this.elem);

};

_.extend(grease.Canvas.prototype, {

    /**
     * Reference to constructor
     * @memberof grease.Canvas#
     */
    constructor: grease.Canvas,

    /**
     * Get the drawing context, either from cache or from the HTML element
     * @memberof grease.Canvas#
     * @param [type='2d']
     * @returns {CanvasContext}
     */
    context: function (type) {
        if (!this._context || type) {
            this._context = this.elem.getContext(type || '2d');
        }
        return this._context;
    },

    /**
     * Clear the canvas
     * @memberof grease.Canvas#
     * @param [coords]
     * @returns {grease.Canvas}
     */
    clear: function (coords) {
        coords = coords || {
            x: 0,
            y: 0,
            width: this.width(),
            height: this.height()
        };

        this.context().clearRect(coords.x, coords.y, coords.width, coords.height);
        return this;
    },

    /**
     * Returns the coordinates of the center point in the canvas
     * @memberof grease.Canvas#
     * @returns {object}
     */
    centerPoint: function () {
        return {
            x: math.floor(this.width() / 2),
            y: math.floor(this.height() / 2)
        };
    },

    /**
     * Get or set the width of the canvas
     * @memberof grease.Canvas#
     * @param {number} [width]
     * @returns {number|grease.Canvas}
     */
    width: function (width) {
        if (_.isUndefined(width)) {
            return this.elem.width;
        } else {
            this.elem.width = width;
            return this;
        }
    },

    /**
     * Get or set the height of the canvas
     * @memberof grease.Canvas#
     * @param {number} [height]
     * @returns {number|grease.Canvas}
     */
    height: function (height) {
        if (_.isUndefined(height)) {
            return this.elem.height;
        } else {
            this.elem.height = height;
            return this;
        }
    },

    /**
     * Remove the canvas from the document
     * @memberof grease.Canvas#
     * @returns {grease.Canvas}
     */
    destroy: function () {
        this.elem.parentElement.removeChild(this.elem);
        return this;
    },

    /**
     * Hide the canvas
     * @memberof grease.Canvas#
     * @returns {grease.Canvas}
     */
    hide: function () {
        this.elem.style.display = 'none';
        return this;
    },

    /**
     * Show the canvas
     * @memberof grease.Canvas#
     * @returns {grease.Canvas}
     */
    show: function () {
        this.elem.style.display = 'block';
        return this;
    }

});
/**
 * Collection of easing functions
 * t: current time, b: beginning value, c: change in value, d: duration
 * @namespace grease.easing
 */
grease.easing = {

    /**
     * Linear ease
     */
    linear: function (t, b, c, d) {
        return c*t/d + b;
    },

    /**
     * easeInQuad
     */
    easeInQuad: function (t, b, c, d) {
        t /= d;
        return c*t*t + b;
    },

    /**
     * easeOutQuad
     */
    easeOutQuad: function (t, b, c, d) {
        t /= d;
        return -c * t*(t-2) + b;
    },

    /**
     * easeInOutQuad
     */
    easeInOutQuad: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t + b;
        }   
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
    },

    /**
     * easeInCubic
     */
    easeInCubic: function (t, b, c, d) {
        t /= d;
        return c*t*t*t + b;
    },

    /**
     * easeOutCubic
     */
    easeOutCubic: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t + 1) + b;
    },

    /**
     * easeInOutCubic
     */
    easeInOutCubic: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t*t + b;
        }
        t -= 2;
        return c/2*(t*t*t + 2) + b;
    },

    /**
     * easeInQuart
     */
    easeInQuart: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t + b;
    },

    /**
     * easeOutQuart
     */
    easeOutQuart: function (t, b, c, d) {
        t /= d;
        t--;
        return -c * (t*t*t*t - 1) + b;
    },

    /**
     * easeInOutQuart
     */
    easeInOutQuart: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t*t*t + b;
        }
        t -= 2;
        return -c/2 * (t*t*t*t - 2) + b;
    },

    /**
     * easeInQuint
     */
    easeInQuint: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t*t + b;
    },

    /**
     * easeOutQuint
     */
    easeOutQuint: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t*t*t + 1) + b;
    },

    /**
     * easeInOutQuint
     */
    easeInOutQuint: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2*t*t*t*t*t + b;
        }
        t -= 2;
        return c/2*(t*t*t*t*t + 2) + b;
    },

    /**
     * easeInSine
     */
    easeInSine: function (t, b, c, d) {
        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
    },

    /**
     * easeOutSine
     */
    easeOutSine: function (t, b, c, d) {
        return c * Math.sin(t/d * (Math.PI/2)) + b;
    },

    /**
     * easeInOutSine
     */
    easeInOutSine: function (t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    },

    /**
     * easeInExpo
     */
    easeInExpo: function (t, b, c, d) {
        return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
    },

    /**
     * easeOutExpo
     */
    easeOutExpo: function (t, b, c, d) {
        return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
    },

    /**
     * easeInOutExpo
     */
    easeInOutExpo: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
        }
        t--;
        return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
    },

    /**
     * easeInCirc
     */
    easeInCirc: function (t, b, c, d) {
        t /= d;
        return -c * (Math.sqrt(1 - t*t) - 1) + b;
    },

    /**
     * easeOutCirc
     */
    easeOutCirc: function (t, b, c, d) {
        t /= d;
        t--;
        return c * Math.sqrt(1 - t*t) + b;
    },

    /**
     * easeInOutCirc
     */
    easeInOutCirc: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) {
            return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
        }
        t -= 2;
        return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
    }

};
/**
 * Collection of utility functions
 * @namespace grease.util
 */
grease.util = {

    /**
     * Produce a basic vector object
     * @param {number} [x=0] Horizontal position
     * @param {number} [y=0] Vertical position
     * @returns {object}
     */
    vector: function (x, y) {
        return {
            x: x || 0,
            y: y || 0
        };
    },

    /**
     * Add two vectors together to create a new vector
     * @param {vector} a
     * @param {vector} b
     * @returns {vector}
     */
    addVectors: function (a, b) {
        return grease.util.vector(a.x + b.x, a.y + b.y);
    }

};
return grease;


}));