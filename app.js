angular.module('rssReaderApp', [])
    .factory('rssService', [
        '$http', function ($http) {
            return {
                parseRSS: function (url) {
                    return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
                }
            };
        }
    ])
    .controller('RssFeedCtrl', [
        '$interval', '$scope', 'rssService',
        function ($interval, $scope, rssService) {
            $scope.articles = [];

            $scope.existingArticles = function () {
                return _.find($scope.articles, function (a) {
                        return !a.cleared
                    }) != null;
            };

            $scope.allAreRead = function () {
                return _.every($scope.articles, function (a) {
                    return a.read;
                });
            };

            var hostname = (function () {
                var a = document.createElement('a');
                return function (url) {
                    a.href = url;
                    return a.hostname;
                }
            })();

            var parseEntry = function (el) {
                return {
                    title: el.title,
                    content: el.content || el.description,
                    read: false,
                    date: el.publishedDate || el.pubDate,
                    link: el.link,
                    shortLink: hostname(el.link)
                };
            };

            $scope.updateModel = function () {
                rssService.parseRSS($scope.rssFeed)
                    .then(function (response) {
                        if (response.data.responseData == null) {
                            return;
                        }

                        var mostRecentDate = null;
                        if ($scope.articles.length && $scope.rssFeed == $scope.originalRssFeed) {
                            mostRecentDate = $scope.articles[0].date;
                        }

                        var entries = _.map(response.data.responseData.feed.entries, function (el) {
                            return parseEntry(el);
                        });

                        if (mostRecentDate != null) {
                            entries = _.filter(entries, function (el) {
                                return el.date < mostRecentDate;
                            });
                        }

                        if ($scope.rssFeed != $scope.originalRssFeed) {
                            $scope.articles = entries;
                            $scope.originalRssFeed = $scope.rssFeed;
                        } else {
                            $scope.articles = _.union($scope.articles, entries);
                        }

                        $scope.articles = _.sortBy($scope.articles, function (el) {
                            return el.date;
                        });
                    });
            };

            // update initially
            $scope.updateModel();

            //then update every 30 secs
            $interval(function () {
                if ($scope.rssFeedFocused) {
                    $scope.updateModel();
                }
            }, 30000);
        }]);
