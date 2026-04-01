import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed?: boolean;
  ai_retry_count?: number;
  ai_last_error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
    },
    category: {
      type: String,
      enum: ['Bug', 'Feature Request', 'Improvement', 'Other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['New', 'In Review', 'Resolved'],
      default: 'New',
    },
    submitterName: {
      type: String,
    },
    submitterEmail: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    ai_category: {
      type: String,
    },
    ai_sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
    },
    ai_priority: {
      type: Number,
      min: 1,
      max: 10,
    },
    ai_summary: {
      type: String,
    },
    ai_tags: {
      type: [String],
    },
    ai_processed: {
      type: Boolean,
      default: false,
    },
    ai_retry_count: {
      type: Number,
      default: 0,
    },
    ai_last_error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ ai_priority: -1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ ai_processed: 1, ai_retry_count: 1 }); // Dead letter query

const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);

export default Feedback;
