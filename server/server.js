/**
 * Server side js.
 */
Meteor.publish('posts', function(){
  return Posts.find();
});
Meteor.startup(function () {
  // code to run on server at startup
});