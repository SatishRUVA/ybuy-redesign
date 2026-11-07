import { Star } from 'lucide-react';
import type { Review } from '../model';
import { relativeTime } from '../model';
import { useDemo } from '../store';
import { Avatar, EmptyState, Stars } from '../ui';
import './trips.css';

/** Summarizes community feedback for an item; intended for listing detail pages. */
export default function ListingReviews({ listingId }: { listingId: string }) {
  const { data } = useDemo();
  const reviews: Review[] = data.reviews.filter((review) => review.listingId === listingId && review.about === 'item-owner').sort((a, b) => b.at - a.at);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const breakdown = [
    { label: 'Accuracy', value: reviews.length ? reviews.reduce((sum, review) => sum + review.scores.accuracy, 0) / reviews.length : 0 },
    { label: 'Communication', value: reviews.length ? reviews.reduce((sum, review) => sum + review.scores.communication, 0) / reviews.length : 0 },
    { label: 'Condition', value: reviews.length ? reviews.reduce((sum, review) => sum + review.scores.condition, 0) / reviews.length : 0 },
  ];
  return <section className="listing-reviews" aria-labelledby="listing-reviews-title"><div className="listing-reviews-heading"><h2 id="listing-reviews-title"><Star size={19} fill="currentColor" />{reviews.length ? average.toFixed(2) : 'New'} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</h2>{reviews.length > 0 && <div className="listing-review-breakdown">{breakdown.map((item) => <div key={item.label}><span>{item.label}</span><span className="listing-review-meter" aria-label={`${item.label}: ${item.value.toFixed(1)} out of 5`}><i style={{ width: `${item.value / 5 * 100}%` }} /></span><strong>{item.value.toFixed(1)}</strong></div>)}</div>}</div>
    {reviews.length ? <div className="listing-review-list">{reviews.map((review) => <article className="listing-review" key={review.id}><div className="listing-review-author"><Avatar name={review.author} initials={review.initials} size={40} /><div><strong>{review.author}</strong><span>{relativeTime(review.at)}</span></div></div><div className="listing-review-rating"><Stars value={review.rating} size={13} /><span>{review.rating}/5</span></div>{review.tags.length > 0 && <p className="listing-review-tags">{review.tags.slice(0, 3).join(' · ')}</p>}<p>{review.text}</p></article>)}</div> : <EmptyState icon={<Star size={24} />} title="No reviews yet" body="Be the first neighbor to share how this item worked out." />}
  </section>;
}

