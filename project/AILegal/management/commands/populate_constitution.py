"""
Management command to populate the constitution_articles table
from constitution_full.json into the Django database (db.sqlite3).

Usage:
    python manage.py populate_constitution
"""

import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from AILegal.models import ConstitutionArticle


class Command(BaseCommand):
    help = 'Populate the constitution_articles table from constitution_full.json'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing records before importing',
        )

    def handle(self, *args, **options):
        filepath = os.path.join(
            settings.BASE_DIR, 'AILegal', 'data', 'constitution_full.json'
        )

        if not os.path.exists(filepath):
            self.stderr.write(self.style.ERROR(f'File not found: {filepath}'))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            articles = json.load(f)

        if options['clear']:
            count_deleted, _ = ConstitutionArticle.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Deleted {count_deleted} existing records.'))

        created = 0
        updated = 0
        skipped = 0

        for art in articles:
            article_number = art.get('article_number', '').strip()
            if not article_number:
                skipped += 1
                continue

            obj, was_created = ConstitutionArticle.objects.update_or_create(
                article_number=article_number,
                defaults={
                    'title': art.get('title', ''),
                    'part': art.get('part', ''),
                    'part_number': art.get('part_number', ''),
                    'tags': art.get('tags', []),
                    'short_description': art.get('short_description', ''),
                    'full_text': art.get('full_text', ''),
                }
            )

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nConstitution import complete!\n'
                f'   Created : {created}\n'
                f'   Updated : {updated}\n'
                f'   Skipped : {skipped}\n'
                f'   Total   : {ConstitutionArticle.objects.count()} articles in database'
            )
        )
