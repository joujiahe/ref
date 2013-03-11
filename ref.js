Posts = new Meteor.Collection('posts');

if (Meteor.isClient) {
  // Posts
  Template.posts.posts = function(){
    return Posts.find({}, {sort: {createdAt: -1}});
  };

  // Return an event map for a text input.
  var entry_event = function(selector) {
    return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
  };

  var entry_event_handler = function(options) {
    var ok = options.ok || function() {};
    var cancel = options.ok || function() {};

    return function(evt) {
      if (evt.type === 'keydown' && evt.which == 27) {
        // escape is cancel
        cancel.call(this, evt);
      } else if (evt.type === 'keyup' && evt.which == 13 ) {
        // blur/return/enter is ok if not empty
        var title = String(document.getElementById('title').value || '');
        var content = String(document.getElementById('content').value || '');
        if (title&&content)
          ok.call(this, evt);
        else
          cancel.call(this, evt);
      }
    };
  };

  Template.entry.events = {};
  Template.entry.events[entry_event('#tags')] = entry_event_handler({
    ok: function(evt) {
      var titleEntry = document.getElementById('title');
      var contentEntry = document.getElementById('content');
      var tagsEntry = document.getElementById('tags');
      var time = Date.now() / 1000;
      Posts.insert({
        userId: Meteor.userId(),
        title: titleEntry.value,
        content: contentEntry.value,
        tags: tagsEntry.value? tagsEntry.value.split(','): [],
        createdAt: time
      });
      titleEntry.value = '';
      contentEntry.value = '';
      tagsEntry.value = '';
    }
  });

  Template.post.createdDatetime = function() {
    var dt = new Date(this.createdAt*1000);
    return dt.toLocaleString();
    //return dt.toDateString()+' '+dt.getHours()+':'+dt.getMinutes()+':'+dt.getSeconds();
  }

  Template.post.getScore = function(score) {
    return this.score? this.score: 0;
  }

  Template.post.events({
    'click .up': function(){
      Posts.update(this._id, {$inc: {score: 1}});
    },
    'click .down': function(){
      Posts.update(this._id, {$inc: {score: -1}});
    }
  });

  // Tags
  Template.tag_filter.tags = function () {
    var tag_infos = [];
    var total_count = 0;

    Posts.find({}).forEach(function (post) {
      _.each(post.tags, function (tag) {
        var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
        if (!tag_info)
          tag_infos.push({tag: tag, count: 1});
        else
          tag_info.count++;
      });
      total_count++;
    });

    tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
    tag_infos.unshift({tag: null, count: total_count});

    return tag_infos;
  };

  Template.tag_filter.tag_text = function () {
    return this.tag || "All items";
  };

  Template.tag_filter.selected = function () {
    return Session.equals('tag_filter', this.tag) ? 'selected' : '';
  };

  Template.tag_filter.events({
    'mousedown .tag': function () {
      if (Session.equals('tag_filter', this.tag))
        Session.set('tag_filter', null);
      else
        Session.set('tag_filter', this.tag);
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
