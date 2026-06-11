# ─────────────────────────────────────────────────────────────────────────────
# THIRD-PARTY ATTRIBUTION
#
# This module is a Django-adapted version of the IKAPI project by Sushant Sinha.
# Adapted for use as a Django service (no file I/O, no multiprocessing).
# All core API logic (HTTP calls, retry strategy, URL construction) is preserved
# from the original source at https://github.com/sushant354/IKAPI
#
# MIT License
# Copyright (c) 2025- Sushant Sinha
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
# ─────────────────────────────────────────────────────────────────────────────

"""
Indian Kanoon API Service — Django Adapter
==========================================
A Django-friendly adapter of IKAPI (github.com/sushant354/IKAPI).

Differences from the original CLI tool:
  - No FileStorage / disk writes
  - No multiprocessing / queues  (not safe inside Django request handlers)
  - All methods return parsed Python dicts instead of raw JSON strings
  - BeautifulSoup used only to strip HTML from returned doc text
  - Retry logic (3 attempts, count*10s sleep) preserved exactly from original
"""

import re
import json
import http.client
import urllib.parse
import logging
import time

from bs4 import BeautifulSoup

logger = logging.getLogger('ikapi')

BASEHOST = 'api.indiankanoon.org'


class IKApi:
    """
    Django-adapted IKApi class.

    Mirrors the public interface of the original IKApi class but returns
    parsed dicts instead of saving to disk.
    """

    def __init__(self, token: str, maxcites: int = 0, maxcitedby: int = 0,
                 maxpages: int = 1, sortby: str = '', fromdate: str = '',
                 todate: str = '', addedtoday: bool = False, orig: bool = False):
        self.logger     = logging.getLogger('ikapi')
        self.headers    = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
        }
        self.basehost   = BASEHOST
        self.maxcites   = maxcites
        self.maxcitedby = maxcitedby
        self.orig       = orig
        self.maxpages   = min(maxpages, 100)   # original caps at 100
        self.addedtoday = addedtoday
        self.fromdate   = fromdate
        self.todate     = todate
        self.sortby     = sortby

    # ──────────────────────────────────────────────────────────────────────────
    # Low-level HTTP  (preserved exactly from original)
    # ──────────────────────────────────────────────────────────────────────────

    def call_api_direct(self, url: str) -> str:
        """Single POST request — mirrors original call_api_direct."""
        connection = http.client.HTTPSConnection(self.basehost, timeout=20)
        connection.request('POST', url, headers=self.headers)
        response = connection.getresponse()
        results  = response.read()

        if isinstance(results, bytes):
            results = results.decode('utf8')
        return results

    def call_api(self, url: str) -> str | None:
        """
        Retry wrapper — mirrors original call_api exactly:
         - Up to 3 attempts
         - Sleeps count*10 seconds between retries
        """
        count = 0
        while count < 3:
            try:
                results = self.call_api_direct(url)
            except Exception as exc:
                self.logger.warning('Error in call_api %s %s', url, exc)
                count += 1
                time.sleep(count * 10)
                continue

            if results is None or (
                isinstance(results, str) and re.match('error code:', results)
            ):
                self.logger.warning('Error in call_api %s %s', url, results)
                count += 1
                time.sleep(count * 10)
            else:
                break

        return results

    # ──────────────────────────────────────────────────────────────────────────
    # API fetch methods  (same URL construction as original)
    # ──────────────────────────────────────────────────────────────────────────

    def fetch_doc(self, docid: int) -> str | None:
        """Mirrors original fetch_doc — returns raw JSON string."""
        url  = '/doc/%d/' % docid
        args = []

        if self.maxcites > 0:
            args.append('maxcites=%d' % self.maxcites)
        if self.maxcitedby > 0:
            args.append('maxcitedby=%d' % self.maxcitedby)
        if args:
            url = url + '?' + '&'.join(args)

        return self.call_api(url)

    def fetch_docmeta(self, docid: int) -> str | None:
        """Mirrors original fetch_docmeta — lightweight metadata, no body."""
        url  = '/docmeta/%d/' % docid
        args = []

        if self.maxcites != 0:
            args.append('maxcites=%d' % self.maxcites)
        if self.maxcitedby != 0:
            args.append('maxcitedby=%d' % self.maxcitedby)
        if args:
            url = url + '?' + '&'.join(args)

        return self.call_api(url)

    def fetch_orig_doc(self, docid: int) -> str | None:
        """Mirrors original fetch_orig_doc — original court PDF/HTML."""
        url = '/origdoc/%d/' % docid
        return self.call_api(url)

    def fetch_doc_fragment(self, docid: int, q: str) -> str | None:
        """Mirrors original fetch_doc_fragment."""
        q   = urllib.parse.quote_plus(q.encode('utf8'))
        url = '/docfragment/%d/?formInput=%s' % (docid, q)
        return self.call_api(url)

    def search(self, q: str, pagenum: int = 0, maxpages: int = 1) -> str | None:
        """Mirrors original search — returns raw JSON string."""
        q   = urllib.parse.quote_plus(q.encode('utf8'))
        url = '/search/?formInput=%s&pagenum=%d&maxpages=%d' % (q, pagenum, maxpages)
        return self.call_api(url)

    # ──────────────────────────────────────────────────────────────────────────
    # Query builder  (preserved from original make_query)
    # ──────────────────────────────────────────────────────────────────────────

    def make_query(self, q: str) -> str:
        """Appends date/sort filters to a query string — mirrors original."""
        if self.fromdate:
            q += ' fromdate: %s' % self.fromdate
        if self.todate:
            q += ' todate: %s' % self.todate
        if self.addedtoday:
            q += ' added:today'
        if self.sortby:
            q += ' sortby: ' + self.sortby
        return q

    # ──────────────────────────────────────────────────────────────────────────
    # High-level Django-friendly methods  (parse + return dicts)
    # ──────────────────────────────────────────────────────────────────────────

    def search_query(self, q: str, pagenum: int = 0, maxpages: int = 1) -> dict:
        """
        Search Indian Kanoon. Returns a parsed dict:
            {
                "found": int,
                "docs": [ { tid, title, docsource, publishdate,
                             numcites, numcitedby, headline }, ... ]
            }
        On error returns { "error": str }.
        """
        full_q  = self.make_query(q)
        raw     = self.search(full_q, pagenum, min(maxpages, self.maxpages))

        if raw is None:
            return {'error': 'No response from Indian Kanoon API'}

        try:
            obj = json.loads(raw)
        except Exception as exc:
            self.logger.error('JSON parse error in search_query: %s', exc)
            return {'error': 'Invalid JSON from Indian Kanoon API'}

        if 'errmsg' in obj:
            return {'error': obj['errmsg']}

        # Strip HTML from headline snippets (same BeautifulSoup approach)
        for doc in obj.get('docs', []):
            if doc.get('headline'):
                soup = BeautifulSoup(doc['headline'], 'html.parser')
                doc['headline'] = soup.get_text(separator=' ', strip=True)

        return {
            'found': obj.get('found', 0),
            'docs':  obj.get('docs', []),
        }

    def get_document(self, docid: int) -> dict:
        """
        Fetch full judgment. Returns parsed dict including:
            doc_text  — plain text of judgment (HTML stripped)
            doc_html  — original HTML
            cites     — list of cited docs
            citedby   — list of citing docs
            + all other metadata fields from IK
        On error returns { "error": str }.
        """
        raw = self.fetch_doc(docid)

        if raw is None:
            return {'error': f'No response for document {docid}'}

        try:
            obj = json.loads(raw)
        except Exception as exc:
            self.logger.error('JSON parse error in get_document %d: %s', docid, exc)
            return {'error': 'Invalid JSON from Indian Kanoon API'}

        if 'errmsg' in obj:
            return {'error': obj['errmsg']}

        # Parse HTML doc body to plain text (mirrors process_level approach)
        if obj.get('doc'):
            soup = BeautifulSoup(obj['doc'], 'html.parser')
            obj['doc_text'] = soup.get_text(separator='\n', strip=True)
            obj['doc_html'] = obj.pop('doc')

        return obj

    def get_document_meta(self, docid: int) -> dict:
        """
        Fetch lightweight metadata (no full doc body).
        On error returns { "error": str }.
        """
        raw = self.fetch_docmeta(docid)

        if raw is None:
            return {'error': f'No response for docmeta {docid}'}

        try:
            obj = json.loads(raw)
        except Exception as exc:
            return {'error': f'Invalid JSON: {exc}'}

        if 'errmsg' in obj:
            return {'error': obj['errmsg']}

        return obj

    def get_citations(self, docid: int) -> dict:
        """
        Cases cited by this document.
        Uses the original 'cites:<docid>' search strategy.
        """
        q   = 'cites:%d' % docid
        raw = self.search(q, pagenum=0, maxpages=1)

        if raw is None:
            return {'docid': docid, 'found': 0, 'docs': [],
                    'error': 'No response from Indian Kanoon API'}

        try:
            obj = json.loads(raw)
        except Exception:
            return {'docid': docid, 'found': 0, 'docs': [],
                    'error': 'Invalid JSON from Indian Kanoon API'}

        if 'errmsg' in obj:
            return {'docid': docid, 'found': 0, 'docs': [], 'error': obj['errmsg']}

        return {
            'docid': docid,
            'found': obj.get('found', 0),
            'docs':  obj.get('docs', []),
        }

    def get_cited_by(self, docid: int) -> dict:
        """
        Cases that cite this document.
        Mirrors original fetch_citedby_docs using 'citedby:<docid>' query.
        """
        q   = 'citedby:%d' % docid    # exact pattern from original
        raw = self.search(q, pagenum=0, maxpages=1)

        if raw is None:
            return {'docid': docid, 'found': 0, 'docs': [],
                    'error': 'No response from Indian Kanoon API'}

        try:
            obj = json.loads(raw)
        except Exception:
            return {'docid': docid, 'found': 0, 'docs': [],
                    'error': 'Invalid JSON from Indian Kanoon API'}

        if 'errmsg' in obj:
            return {'docid': docid, 'found': 0, 'docs': [], 'error': obj['errmsg']}

        return {
            'docid': docid,
            'found': obj.get('found', 0),
            'docs':  obj.get('docs', []),
        }

    def get_doc_fragment(self, docid: int, q: str) -> dict:
        """Highlighted fragment of a document matching a keyword."""
        raw = self.fetch_doc_fragment(docid, q)

        if raw is None:
            return {'error': 'No response from Indian Kanoon API'}

        try:
            return json.loads(raw)
        except Exception:
            return {'error': 'Invalid JSON from Indian Kanoon API'}


# ─────────────────────────────────────────────────────────────────────────────
# Factory helper used by Django views
# ─────────────────────────────────────────────────────────────────────────────

def get_ik_service(maxcites: int = 0, maxcitedby: int = 0,
                   maxpages: int = 1, sortby: str = '',
                   fromdate: str = '', todate: str = '') -> 'IKApi | None':
    """
    Returns a configured IKApi instance using INDIANKANOON_API_TOKEN
    from Django settings / environment. Returns None if token is absent.
    """
    import os
    token = os.environ.get('INDIANKANOON_API_TOKEN', '').strip()

    if not token:
        try:
            from django.conf import settings
            token = getattr(settings, 'INDIANKANOON_API_TOKEN', '').strip()
        except Exception:
            pass

    if not token:
        return None

    return IKApi(
        token      = token,
        maxcites   = maxcites,
        maxcitedby = maxcitedby,
        maxpages   = maxpages,
        sortby     = sortby,
        fromdate   = fromdate,
        todate     = todate,
    )
