from flask import jsonify
import json

class PaginatedAuthorResponse:
    def __init__(self, authors, start, limit, count):
        self.authors = []

        for author in authors:
            self.authors.append(author.__dict__)

        self.start = start
        self.limit = limit
        self.current_size = len(authors)
        self.count = count

    def get_json(self, url):
        if self.start <= 1:
            previous_url = ""
        else:
            start_previous = max(1, self.start - self.limit)
            previous_url = "{0}?start={1}&limit={2}".format(url, start_previous, self.limit)

        if self.start + self.limit > self.count:
            next_url = ""
        else:
            start_next = self.start + self.limit
            next_url = "{0}?start={1}&limit={2}".format(url, start_next, self.limit)

        return {
                "authors": self.authors,
                "start": self.start,
                "limit": self.limit,
                "current_size": self.current_size,
                "count": self.count,
                "previous": previous_url,
                "next": next_url
                }
