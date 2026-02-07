import {Schema, model} from "mongoose";

const meetingSchema = new Schema({
    userId: {
        type: String
    },
    meetingCode: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    }
});

const Meeting = model("Meeting", meetingSchema);

export {Meeting};