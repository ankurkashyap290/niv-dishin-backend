const lastModified = function(schema, options) {
  schema.pre('save', function(next) {
    this.modifiedAt = new Date();
    next();
  });

  if (options) {
    schema.path('modifiedAt');
  }
};
module.exports = lastModified;
