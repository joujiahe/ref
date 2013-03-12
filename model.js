/**
 * Models share for both client and server.
 *
 * Post document structure:
 *   userId: Post owner id.
 *   title: String of post title.
 *   content: String of post content.
 *   tags: Array of post's tags.
 *   score: Integer of post votes.
 *   scoredUsers: Array of voted users.
 *   createdAt: Timestamp of creation time.
 */
Posts = new Meteor.Collection('posts');

Posts.allow({
  insert: function(userId, doc) {
    return userId;
  },
  update: function(userId, docs, fieldNames, modifier) {
    return userId;
  },
});