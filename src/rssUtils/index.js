import steem from 'steem'
import RSS from 'rss'
import xml from 'xml'
import { promisify } from 'util'
var config = require('../config');
var showdown = require('showdown');
var markdownConverter = new showdown.Converter();


const getDiscussionsByCreated = promisify(steem.api.getDiscussionsByCreated);
const getDiscussionsByFeed = promisify(steem.api.getDiscussionsByFeed);
const getDiscussionsByBlog = promisify(steem.api.getDiscussionsByBlog);
const getDiscussionsByHot = promisify(steem.api.getDiscussionsByHot);
const getDiscussionsByTrending = promisify(steem.api.getDiscussionsByTrending);
const getDiscussionsByPromoted = promisify(steem.api.getDiscussionsByPromoted);
const getDiscussionsByComments = promisify(steem.api.getDiscussionsByComments);
const getDiscussionsByVotes = promisify(steem.api.getDiscussionsByVotes);
const getDiscussionsByCashout = promisify(steem.api.getDiscussionsByCashout);

const rssGeneratorUser = async (username, type, iface) => {
    const feedOption = {
        title: `Posts from @${username}'s ${type}`,
        feed_url: `${config.FEED_URL}/@${username}/${type}?interface=${iface}`,
        site_url: `${makeUserProfileURL(username,type,iface)}`,
        image_url: 'https://steemit.com/images/steemit-share.png',
        docs: 'https://github.com/steemrss/steemrss'
    } 

        const apiResponse = await getContent(type, username)
        const feed = new RSS(feedOption)
        const completedFeed = await feedItem(feed, apiResponse, iface)
        return completedFeed.xml()
}


const rssGeneratorTopic = async (category, tag, iface) => {
    if (iface == 'ulogs') {
        var site_url = `https://ulogs.org/${category}/${tag}`
    } else {
        var site_url = `https://steemit.com/${category}/${tag}`
    }

    const feedOption = {
        title: `${category} ${tag} posts`,
        feed_url: `${config.FEED_URL}/${category}/${tag}?interface=${iface}`,
        site_url: `${site_url}`,
        image_url: 'https://steemit.com/images/steemit-share.png',
        docs: 'https://github.com/steemrss/steemrss'
    } 

        const apiResponse = await getContent(category, tag)
        const feed = new RSS(feedOption)
        const completedFeed = await feedItem(feed, apiResponse, iface)
        return completedFeed.xml()
}

const makeUserProfileURL = (username, type, iface) => {
    if (iface == 'ulogs') {
        return `https://ulogs.org/@${username}/${type}`
    } else {
        return `https://steemit.com/@${username}/${type}`;
    }
}

const methodMap = {
    'feed': (query) => getDiscussionsByFeed(query),
    'blog': (query) => getDiscussionsByBlog(query),
    'new': (query) => getDiscussionsByCreated(query),
    'created': (query) => getDiscussionsByCreated(query),
    'hot': (query) => getDiscussionsByHot(query),
    'trending': (query) => getDiscussionsByTrending(query),
    'promoted': (query) => getDiscussionsByPromoted(query),
    'comments': (query) => getDiscussionsByComments({limit: query.limit, start_author: query.tag}),
    'votes': (query) => getDiscussionsByVotes(query),
    'cashout': (query) => getDiscussionsByCashout(query),
}

const getContent = async (category, tag) => methodMap.hasOwnProperty(category) ?
                                            await methodMap[category]({tag, limit: 10}) :
                                            Promise.reject({status: 400, message: "Unknown Category"})


const feedItem = async (feed, response, iface) => {
    console.log(response)

    response.forEach(({title, url, author, category, created: date, body}) => {
        if (iface == 'ulogs') {
            var url = `https://ulogs.org/${url}`
        } else {
            var url = `https://steemit.com/${url}`
        }

        feed.item({
            title,
            url: `${url}`,
            categories: [category],
            author,
            date,
            description: body.replace(/!\[.*\]\(.*\)/g, (x) => {return markdownConverter.makeHtml(x);})
        })
    });

    return feed
}

module.exports = {
    rssGeneratorTopic: rssGeneratorTopic,
    rssGeneratorUser: rssGeneratorUser
}