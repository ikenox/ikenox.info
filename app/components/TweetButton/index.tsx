import logo from './x-logo.svg';
import './index.css';

export const TweetButton = (props: { url: string; text: string }) => {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.text)}&url=${encodeURIComponent(
    props.url
  )}`;
  return (
    <button
      onClick={() => {
        window.open(url, '_blank');
      }}
      className="tweet-button"
    >
      <img src={logo} alt={'Share this page on X'} width={'12'} height={'12'} />
      Share
    </button>
  );
};
