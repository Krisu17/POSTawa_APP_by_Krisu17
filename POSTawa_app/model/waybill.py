#!/usr/bin/env python
# -*- coding: utf8 -*-
import uuid
from fpdf import FPDF
from datetime import datetime


class Waybill:

    def __init__(self, sender, recipient, creation_date, package_id, waybill_image_path):
        self.__sender = sender
        self.__recipient = recipient
        self.__creation_date = creation_date
        self.__package_id = package_id
        self.__waybill_image_path = waybill_image_path

    def generate_and_save(self, path="./"):
        pdf = FPDF()
        pdf.add_page()
        pdf.add_font('Calibri', '', 'static/fonts/calibri.ttf', uni=True)
        pdf.set_font('Calibri', '', size=10)
        filename = "{}{}.pdf".format(path, self.__package_id)
        self.__add_table_to_pdf(pdf, filename)

        
        pdf.output(filename)

        return filename

    def __add_table_to_pdf(self, pdf, fn):
        n_cols = 2
        col_width = (pdf.w - pdf.l_margin - pdf.r_margin) / n_cols / 2
        font_size = pdf.font_size
        n_lines = 7
        file_name = fn.split('/')
        
        
        pdf.cell(col_width, n_lines * font_size, "Sender", border=1)
        pdf.multi_cell(col_width, font_size, txt=self.__sender.str_full(), border=1)
        pdf.ln(0)
        pdf.cell(col_width, n_lines * font_size, "Recipient", border=1)
        pdf.multi_cell(col_width, font_size, txt=self.__recipient.str_full(), border=1)
        pdf.ln(0)
        pdf.cell(col_width*2, n_lines * font_size, file_name[1], border=1)

        if (self.__waybill_image_path is not ""):
            fileExtension = self.__waybill_image_path.split('.')[-1]
            pdf.image(name = self.__waybill_image_path, type = fileExtension, x = 11, y = 85, w = 100)



class Person:

    def __init__(self, name: str, surname: str, phone_number: str, address):
        self.__name = name
        self.__surname = surname
        self.__address = address
        self.__phone = phone_number

    def get_name(self):
        return self.__name

    def get_surname(self):
        return self.__surname

    def get_fullname(self):
        return "{} {}".format(self.__name, self.__surname)

    def get_address(self):
        return self.__address
    
    def get_phone(self):
        return self.__phone

    def str_full(self):
        return "{}\n{}\n{}".format(self.get_fullname(), self.get_phone(), self.__address.str_full())


class Address:

    def __init__(self, street: str, city: str, postal_code: str, country: str):
        self.__street = street
        self.__city = city
        self.__postal_code = postal_code
        self.__country = country

    def get_street(self):
        return self.__street

    def get_city(self):
        return self.__city

    def get_postal_code(self):
        return self.__postal_code

    def get_country(self):
        return self.__country

    def str_full(self):
        result = ""
        for field_value in self.__dict__.values():
            result += "\n{}".format(field_value)

        return result