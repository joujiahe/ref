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
        var value = String(evt.target.value || '');
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  };

  Template.entry.events = {};
  Template.entry.events[entry_event('#content')] = entry_event_handler({
    ok: function(text, evt) {
      var titleEntry = document.getElementById('title');
      var time = Date.now() / 1000;
      Posts.insert({userId: Meteor.userId(), title: titleEntry.value, content: text, createdAt: time});
      titleEntry.value = '';
      evt.target.value = '';
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
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
