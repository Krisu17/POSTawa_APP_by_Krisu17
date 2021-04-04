from flask import Flask
from src.service.repositories.author_repository import AuthorRepository
from src.dto.response.paginated_author_response import PaginatedAuthorResponse

app = Flask(__name__)

class AuthorService:

    def __init__(self):
        self.author_repo = AuthorRepository()

    def add_author(self, author_req):
        app.logger.debug("Adding author...")
        author_id = self.author_repo.save(author_req)
        app.logger.debug("Added author (id: {0})".format(author_id))
        return author_id

    def get_author_by_id(self, author_id):
        app.logger.debug("Getting author by id: {0}.".format(author_id))
        author = self.author_repo.find_by_id(author_id)

        if author == None:
            raise AuthorNotFoundByIdException("Not found author by id: {0}".format(author_id))

        app.logger.debug("Got author by id: {0}".format(author_id))
        return author

    def get_paginated_author_response(self, start, limit):
        app.logger.debug("Getting paginated authors (start: {0}, limit: {1})".format(start, limit))
        n_of_author = self.author_repo.count_all()

        authors = self.author_repo.find_n_authors(start, limit)

        authors_response = PaginatedAuthorResponse(authors, start, limit, n_of_author)

        app.logger.debug("Got paginated authors (start: {0}, limit: {1}, count: {2}, current_size: {3})".format(start, limit, n_of_authors, len(authors)))
        return authors_response
