/**
 * Client side js.
 */
Session.set("queryLimitOffset", 130);
Session.set("queryLimit", ($(window).height()/Session.get("queryLimitOffset"))|0);
Session.setDefault("tagFilter", null);
Session.setDefault("selectedPost", null);

var postsHandle = null;
// Always be subscribed to the todos for the selected list.
Meteor.autorun(function () {
  postsHandle = Meteor.subscribe('posts');
  $(window).scroll(function(evt){
    current = ($(window).height()+$(window).scrollTop())/Session.get("queryLimitOffset");
    if (Session.get("queryLimit") < current)
      Session.set("queryLimit", current);
  });
});

Template.posts.loading = function () {
  return postsHandle && !postsHandle.ready();
};

// Posts
Template.posts.posts = function() {
  var sel = {};
  var tagFilter = Session.get('tagFilter');
  var selectedPost = Session.get('selectedPost');
  if(tagFilter)
    sel.tags = tagFilter;
  if(selectedPost) {
    sel._id = selectedPost;
  } else {
    sel.parentId = null;
  }

  return Posts.find(sel, {limit: Session.get("queryLimit"), sort: {createdAt: -1}});
};

Template.comments.comments = function() {
  var sel = {};
  var selectedPost = Session.get('selectedPost');
  if(!selectedPost)
    return null;
  sel.parentId = selectedPost;
  return Posts.find(sel, {limit: Session.get("queryLimit"), sort: {createdAt: 1}});
};

Template.post.inArray = function (tags) {
  result = [];
  for (var key in tags) result.push({name:key,value:tags[key]});
  return result;
};

Template.post.isUrl = function() {
  return (this.content.substr(0, 7) == "http://" || this.content.substr(0, 8) == "https://");
}

Template.post.isComment = function() {
  return this.parentId? true: false;
}

Template.post.commentsCount = function() {
  var sel = {};
  sel.parentId = this._id;
  var comments = Posts.find(sel);
  return comments.count();
};

Template.post.selected = function() {
  return Session.equals('selectedPost',this._id);
}

Template.post.events({
  'mousedown .tag': function () {
    if (Session.equals('tagFilter', this.value))
      Session.set('tagFilter', null);
    else
      Session.set('tagFilter', this.value);
  },
  'click .icon-remove': function () {
    Session.set('selectedPost', null);
  }
});

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

var post_submit = function(){
  var titleEntry = document.getElementById('title');
  var contentEntry = document.getElementById('content');
  var tagsEntry = document.getElementById('tags');
  var time = Date.now() / 1000;
  Posts.insert({
    userId: Meteor.userId(),
    parentId: Session.get('selectedPost'),
    title: titleEntry.value,
    content: contentEntry.value,
    tags: tagsEntry.value? tagsEntry.value.split(','): [],
    score: 0,
    scoredUsers: [],
    createdAt: time
  });
  titleEntry.value = '';
  contentEntry.value = '';
  tagsEntry.value = '';
};

//Template.entry.events = {};
//Template.entry.events[entry_event('#tags')] = entry_event_handler({
Template.entry.events({
  //ok: function(evt) {
  'click .submit': post_submit,
});

Template.entry.inPost = function() {
    return Session.get('selectedPost')? true: false;
};

Template.post.createdDatetime = function() {
  var dt = new Date(this.createdAt * 1000);
  return dt.toLocaleString();
  //return dt.toDateString()+' '+dt.getHours()+':'+dt.getMinutes()+':'+dt.getSeconds();
}

Template.post.createdTimeFromNow = function() {
  var dt = new Date(this.createdAt * 1000);
  var nTotalDiff = new Date(Date.now() - dt.getTime());
  var oDiff = new Object();
  
  if (nTotalDiff < 0)
    nTotalDiff =0;

  oDiff.days = Math.floor(nTotalDiff/1000/60/60/24);
  nTotalDiff -= oDiff.days*1000*60*60*24;
  if (oDiff.days > 7)
    return dt.toLocaleString();

  oDiff.hours = Math.floor(nTotalDiff/1000/60/60);
  nTotalDiff -= oDiff.hours*1000*60*60;

  oDiff.minutes = Math.floor(nTotalDiff/1000/60);
  nTotalDiff -= oDiff.minutes*1000*60;

  oDiff.seconds = Math.floor(nTotalDiff/1000);

  var diff = oDiff.days? oDiff.days+' days ' : '';
  diff += oDiff.hours? oDiff.hours+' hours ' : '';
  diff += oDiff.minutes? oDiff.minutes+' minutes ' : '';
  diff += oDiff.seconds? oDiff.seconds+' seconds ago' : '';
  return diff;
  //return dt.toDateString()+' '+dt.getHours()+':'+dt.getMinutes()+':'+dt.getSeconds();
}

Template.post.getScore = function(score) {
  return this.score? this.score: 0;
}

Template.post.events({
  'click .up': function() {
    if(!Meteor.userId()) {
      alert('Please login before vote!');
      return false;
    }
    if(!this.scoredUsers) {
      this.scoredUsers = [];
    }
    else if($.inArray(Meteor.userId(), this.scoredUsers)!=-1) {
      alert('You have already voted!');
      return false;
    }
    
    Posts.update(this._id, {$inc: {score: 1}, $addToSet: {scoredUsers: Meteor.userId()}});
  },
  'click .down': function() {
    if(!Meteor.userId()) {
      alert('Please login before vote!');
      return false;
    }
    if(!this.scoredUsers) {
      this.scoredUsers = [];
    }
    else if($.inArray(Meteor.userId(), this.scoredUsers)!=-1) {
      alert('You have already voted!');
      return false;
    }

    Posts.update(this._id, {$inc: {score: -1}, $addToSet: {scoredUsers: Meteor.userId()}});
  },
  'click .comments': function() {
    //alert(this._id);
    Session.set('selectedPost', this._id);
  }
});

// Tags
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;
  var tagFilterCount = 0;

  var tagFilter = Session.get('tagFilter');
  
  Posts.find({}).forEach(function (post) {
    _.each(post.tags, function (tag) {
      if (tagFilter && tagFilter===tag) {
        tagFilterCount++;
        return;
      }
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (!tag_info) 
          tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });
  //tag_infos = _.sortBy(tag_infos, function (x) { return -x.count; });
  tag_infos = _.sortBy(tag_infos, function () { return 0.5 - Math.random(); });
  if(!tagFilter)
    tag_infos.unshift({tag: null, count: total_count});
  else
    tag_infos.unshift({tag: tagFilter, count: tagFilterCount});

  return tag_infos.slice(0,6);
};

Template.tag_filter.tag_text = function () {
  return this.tag || "All items";
};

Template.tag_filter.selected = function () {
  return Session.equals('tagFilter', this.tag) ? 'selected label label-info' : '';
};

Template.tag_filter.events({
  'mousedown .tag': function () {
    if (Session.equals('tagFilter', this.tag))
      Session.set('tagFilter', null);
    else
      Session.set('tagFilter', this.tag);

    Session.set('selectedPost', null);
  },
  'mouseenter .tag': function (evt) {
    //$(evt.target).addClass('selected label label-info');
  },
  'mouseleave .tag': function (evt) {
    //$(evt.target).removeClass('selected label label-info');
  }
});
