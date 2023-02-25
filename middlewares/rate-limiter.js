const { RateLimiterMemory } = require('rate-limiter-flexible');

const MAX_REQUEST_LIMIT = 5;
const MAX_REQUEST_WINDOW = 1; // Per 20 seconds by IP
const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests';

const options = {
    duration: MAX_REQUEST_WINDOW,
    points: MAX_REQUEST_LIMIT,
}

const rateLimiter = new RateLimiterMemory(options);

module.exports = rateLimiterMiddleware = (req,res,next) => {
    rateLimiter
        .consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            res.status(429).json({ message: TOO_MANY_REQUESTS_MESSAGE });
        });
};