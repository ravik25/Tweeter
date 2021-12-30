const mongoose = require('mongoose');
const { Schema } = mongoose;

var contentSchema = new Schema({
    author : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true
    },
    content : {
        type : String,
        required : true
    },
    likes : {
        type : [String]
    }
});

const KooContent = mongoose.model('KooContent', contentSchema);

module.exports = KooContent;