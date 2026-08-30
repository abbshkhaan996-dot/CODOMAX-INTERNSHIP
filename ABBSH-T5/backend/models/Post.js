const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    tag: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

/* same idea as the User model:
   - _id -> id (string)
   - authorId -> plain string, so the frontend's === comparisons keep working
   - date -> "YYYY-MM-DD" string, exactly the format the frontend already formats and sorts by */
postSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.authorId = ret.authorId ? ret.authorId.toString() : ret.authorId;
    ret.date = new Date(ret.date).toISOString().slice(0, 10);
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("Post", postSchema);
