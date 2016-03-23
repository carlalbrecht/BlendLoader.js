######################################################
#  Name:
#    dna.py
#      
#  Description:
#    creates an SDNA struct dump into JS objects.
#       
#  Author:
#    Jeroen Bakker, modifications Carl Albrecht
#        
#  Version:
#    v0.1 (12-05-2009) - migration of original source code to python.
#       Added code to support blender 2.5 branch
#    v1.0 (01-01-1970) - modified code to dump to JS objects instead
#       of HTML tables.
#        
#  Input:
#    Sample .blend file from target blender version (currently using 2.76b)
#        
#  Output:
#    dna.html
#    dna.css (will only be created when not existing)
#
#  Startup:
#    ./blender -P dna.py
#
#  Process:
#    1: write temp blend file with SDNA info
#    2: read blend header from blend file
#    3: seek DNA1 file-block
#    4: read dna record from blend file
#    5: close and delete temp blend file
#    6: export dna to html and css
#    7: quit blender
#
#   the Blender 2.5 branch at this moment does not
#   support this process. Therefore it has to be performed
#   manually:
#   1. start blender
#   2. save scene to "dna.blend"
#   3. start python dna.py
#   Using this method will not delete the "dna.blend"
######################################################

# ***** BEGIN GPL LICENSE BLOCK *****
#
# Script copyright (C) Jeroen Bakker
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software Foundation,
# Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
#
# ***** END GPL LICENCE BLOCK *****

######################################################
# Importing modules
######################################################
import os
import struct

# in current Blender 2.5 branch this module is not implemented
try:
  import Blender
except:
  Blender = None

######################################################
# module global variables
######################################################

Filename_Blend = "dna.blend" # temporarily blend file 
Filename_HTML = "dna.html"   # output html file
Filename_CSS = "dna.css"     # output css file

######################################################
# module global routines
######################################################
# read routines

######################################################
#    ReadString reads a String of given length from a file handle
######################################################
def ReadString(handle, length):
  return str(handle.read(length))

######################################################
#    ReadString0 reads a zero terminating String from a file handle
######################################################
def ReadString0(handle):
  Result = ""
  S = ReadString(handle, 1)
  while S!="\0":
    Result=Result+S
    S=ReadString(handle, 1)
    
  return Result

######################################################
#    ReadUShort reads an unsigned short from a file handle
######################################################
def ReadUShort(handle):
  return struct.unpack("H", str(handle.read(2)))[0]

######################################################
#    ReadUInt reads an unsigned integer from a file handle
######################################################
def ReadUInt(handle):
  return struct.unpack("I", str(handle.read(4)))[0]

######################################################
#    ReadULong reads an unsigned long from a file handle
######################################################
def ReadULong(handle):
  return struct.unpack("Q", str(handle.read(8)))[0]

######################################################
#    ReadPointer reads an pointerfrom a file handle
#    the pointersize is given by the header (BlendFileHeader)
######################################################
def ReadPointer(handle, header):
  if header.PointerSize == 4:
    return ReadUInt(handle)
  if header.PointerSize == 8:
    return ReadULong(handle)
######################################################
#    Allign alligns the filehandle on 4 bytes
######################################################
def Allign(handle):
  offset = handle.tell()
  trim = offset % 4
  if trim != 0:
    handle.seek(4-trim, os.SEEK_CUR)

######################################################
# module classes
######################################################

######################################################
#    BlendFileHeader allocates the first 12 bytes of a blend file
#    it contains information about the hardware architecture
######################################################
class BlendFileHeader:
  Magic = "BLENDER"
  PointerSize = 4
  LittleEndianness = False
  Version = 249

  def __init__(self, handle):
    self.Magic = ReadString(handle, 7)
    tPointerSize = ReadString(handle, 1)
    if tPointerSize=="-":
      self.PointerSize=8
    if tPointerSize=="_":
      self.PointerSize=4
    tEndianness = ReadString(handle, 1)
    if tEndianness=="v":
      self.LittleEndianness=True
    if tEndianness=="V":
      self.LittleEndianness=False
    self.Version = int(ReadString(handle, 3))

######################################################
#    FileBlockHeader contains the information in a file-block-header
#    the class is needed for searching to the correct file-block (containing Code: DNA1)
######################################################
class FileBlockHeader:
  Code=None
  Size=None
  OldAddress=None
  SDNAIndex=None
  Count=None

  def __init__(self, handle, header):
    self.Code = ReadString(handle, 4)
    self.Size = ReadUInt(handle)
    self.OldAddress = ReadPointer(handle, header)
    self.SDNAIndex = ReadUInt(handle)
    self.Count = ReadUInt(handle)

  def skip(self, handle):
    handle.read(self.Size)
    
######################################################
#    DNACatalog is a catalog of all information in the DNA1 file-block
######################################################
class DNACatalog:
  Header=None
  Names=None
  Types=None
  Structs=None

  def __init__(self, header, block, handle):
    self.Names=[]
    self.Types=[]
    self.Structs=[]
    self.Header = header
    SDNA = ReadString(handle, 4)
    NAME = ReadString(handle, 4)
    numberOfNames = ReadUInt(handle)
    print(" reading "+str(numberOfNames)+" names")
    for i in range(0, numberOfNames):
      tName = ReadString0(handle)
      self.Names.append(DNAName(tName))

    Allign(handle)
    TYPE = ReadString(handle, 4)
    numberOfTypes = ReadUInt(handle)
    print(" reading "+str(numberOfTypes)+" types")
    for i in range(0, numberOfTypes):
      tType = ReadString0(handle)
      self.Types.append(DNAType(tType))

    Allign(handle)
    TLEN = ReadString(handle, 4)
    print(" reading "+str(numberOfTypes)+" tlen")
    for i in range(0, numberOfTypes):
      tLen = ReadUShort(handle)
      self.Types[i].Size = tLen

    Allign(handle)
    STRC = ReadString(handle, 4)
    numberOfStructures = ReadUInt(handle)
    print(" reading "+str(numberOfStructures)+" structures")
    for structureIndex in range(0, numberOfStructures):
      tType = ReadUShort(handle)
      Type = self.Types[tType]
      structure = DNAStructure(Type)
      self.Structs.append(structure)

      numberOfFields = ReadUShort(handle)
      for fieldIndex in range(0, numberOfFields):
        fTypeIndex = ReadUShort(handle)
        fNameIndex = ReadUShort(handle)
        fType = self.Types[fTypeIndex]
        fName = self.Names[fNameIndex]
        structure.Fields.append(DNAField(fType, fName))
      
        
  def WriteToHTML(self, handle):
    #write html header
    handle.write("<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\">\r\n")
    handle.write("<html>\r\n")
    handle.write("<head>\r\n")
    handle.write("<link rel=\"stylesheet\" type=\"text/css\" href=\"dna.css\" media=\"screen, print\" />\r\n")
    handle.write("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=ISO-8859-1\" />\r\n")
    handle.write("<title>The mystery of the blend</title>\r\n")
    handle.write("</head>\r\n")
    handle.write("<body>\r\n")
    handle.write("<div class=\"title\">Blender SDNA "+str(self.Header.Version)+"<br/>\r\n")
    handle.write("Internal SDNA structures</div>\r\n")

    # create document index
    handle.write("<h1>Index of blender structures</h1>\r\n")
    handle.write("<ul class=\"multicolumn\">\r\n")
    structureIndex = 0
    for structure in self.Structs:
      handle.write("<li class=\"multicolumn\">("+str(structureIndex)+") <a href=\"#struct:"+structure.Type.Name+"\">"+structure.Type.Name+"</a></li>\r\n")
      structureIndex+=1
    handle.write("</ul>\r\n")
    
    #create structure-tables
    for structure in self.Structs:
      structure.WriteToHTML(self, handle)
      
    #write html footer
    handle.write("</body>\r\n")
    handle.write("</html>\r\n")
    
######################################################
#        Write the Cascading stylesheet template to the handle
#        It is expected that the handle is a Filehandle
######################################################
  def WriteToCSS(self, handle):
    handle.write("@CHARSET \"ISO-8859-1\";\r\n")
    handle.write("TABLE {\r\n")
    handle.write("  border-width: 1px;\r\n")
    handle.write("  border-style: solid;\r\n")
    handle.write("  border-color: #000000;\r\n")
    handle.write("  border-collapse: collapse;\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("DIV.title {\r\n")
    handle.write("  font-size: large;\r\n")
    handle.write("  text-align: center\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("label {\r\n")
    handle.write("  font-weight:bold;\r\n")
    handle.write("  width:100px;\r\n")
    handle.write("  float:left;\r\n")
    handle.write("}\r\n")
    handle.write("label:after {\r\n")
    handle.write("  content:\":\";\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("TH {\r\n")
    handle.write("  background-color: #000000;\r\n")
    handle.write("  color:#ffffff;\r\n")
    handle.write("  padding-left:5px;\r\n")
    handle.write("  padding-right:5px;\r\n")
    handle.write("}\r\n")
    handle.write("TR {\r\n")
    handle.write("}\r\n")
    handle.write("TD {\r\n")
    handle.write("  border-width: 1px;\r\n")
    handle.write("  border-style: solid;\r\n")
    handle.write("  border-color: #a0a0a0;\r\n")
    handle.write("  padding-left:5px;\r\n")
    handle.write("  padding-right:5px;\r\n")
    handle.write("}\r\n")
    handle.write("BODY {\r\n")
    handle.write("  font-family: verdana;\r\n")
    handle.write("  font-size: small;\r\n")
    handle.write("}\r\n")
    handle.write("H1 {\r\n")
    handle.write("  page-break-before: always;\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("H1, H2 {\r\n")
    handle.write("  background-color: #a0a0a0;\r\n")
    handle.write("  color:#404040;\r\n")
    handle.write("  padding-left: 40px;\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("H3 {\r\n")
    handle.write("  padding-left: 40px;\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("ul.multicolumn {\r\n")
    handle.write("  list-style:none;\r\n")
    handle.write("  float:left;\r\n")
    handle.write("  padding-right:0px;\r\n")
    handle.write("  margin-right:0px;\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("li.multicolumn {\r\n")
    handle.write("  float:left;\r\n")
    handle.write("  width:200px;\r\n")
    handle.write("  margin-right:0px;\r\n")
    handle.write("}\r\n")
    handle.write("a {\r\n")
    handle.write("  color:#a000a0;\r\n")
    handle.write("  text-decoration:none;\r\n")
    handle.write("}\r\n")
    handle.write("a:hover {\r\n")
    handle.write("  color:#a000a0;\r\n")
    handle.write("  text-decoration:underline;\r\n")
    handle.write("}\r\n")
    handle.write("\r\n")
    handle.write("table {\r\n")
    handle.write("  width:100%;\r\n")
    handle.write("}\r\n")

######################################################
#    DNAName is a C-type name stored in the DNA
######################################################
class DNAName:
  Name=None

  def __init__(self, aName):
    self.Name = aName
    
  def AsReference(self, parent):
    if parent == None:
      Result = ""
    else:
      Result = parent+"."
      
    Result += self.ShortName()
    return Result

  def ShortName(self):
    Result = self.Name;
    Result = Result.replace("*", "")
    Result = Result.replace("(", "")
    Result = Result.replace(")", "")
    Index = Result.find("[")
    if Index <> -1:
      Result = Result[0:Index]
    return Result
    
  def IsPointer(self):
    return self.Name.find("*")>-1

  def IsMethodPointer(self):
    return self.Name.find("(*")>-1

  def ArraySize(self):
    Result = 1
    Temp = self.Name
    Index = Temp.find("[")

    while Index <> -1:
      Index2 = Temp.find("]")
      Result*=int(Temp[Index+1:Index2])
      Temp = Temp[Index2+1:]
      Index = Temp.find("[")
    
    return Result

######################################################
#    DNAType is a C-type stored in the DNA
######################################################
class DNAType:
  Name=None
  Size=None
  Structure=None
  
  def __init__(self, aName):
    self.Name = aName

######################################################
#    DNAType is a C-type structure stored in the DNA
######################################################
class DNAStructure:
  Type=None
  Fields=None

  def __init__(self, aType):
    self.Type = aType
    self.Type.Structure = self
    self.Fields=[]

  def WriteToHTML(self, catalog, handle):
    handle.write("<a name=\"struct:"+self.Type.Name+"\"></a>\r\n")
    handle.write("<h3>Structure: "+self.Type.Name+"</h3>\r\n")
    handle.write("<table><caption>"+self.Type.Name+"</caption><thead><tr><th>reference</th><th>structure</th><th>type</th><th>name</th><th>offset</th><th>size</th></tr></thead>\r\n")
    handle.write("<tbody>\r\n")

    offset = 0
    self.WriteFieldsToHTML(catalog, None, offset, handle)
      
    handle.write("</tbody>\r\n")
    handle.write("</table>\r\n")
    handle.write("<label>total size</label> "+str(self.Type.Size)+" bytes<br/>\r\n\r\n")

  def WriteFieldsToHTML(self, catalog, parentReference, offset, handle):
    for field in self.Fields:
      offset += field.WriteToHTML(catalog, self, parentReference, offset, handle)
    return self.Type.Size
    
######################################################
#    DNAField is a coupled DNAType and DNAName
######################################################
class DNAField:
  Type=None
  Name=None

  def __init__(self, aType, aName):
    self.Type = aType
    self.Name = aName
    
  def WriteToHTML(self, catalog, structure, parentReference, offset, handle):
    if self.Type.Structure == None or self.Name.IsPointer():
      handle.write("<tr>")
      handle.write("<td>")
      handle.write(self.Name.AsReference(parentReference))
      handle.write("</td>")
      handle.write("<td>")
      if parentReference <> None:
        handle.write("<a href=\"#struct:"+structure.Type.Name+"\">"+structure.Type.Name+"</a>\r\n")
      else:
        handle.write(structure.Type.Name)
      handle.write("</td>")
      handle.write("<td>")
      handle.write(self.Type.Name)
      handle.write("</td>")
      handle.write("<td>")
      handle.write(self.Name.Name)
      handle.write("</td>")
      handle.write("<td>")
      handle.write(str(offset))
      handle.write("</td>")
      handle.write("<td>")
      handle.write(str(self.Size(catalog.Header)))
      handle.write("</td>")
      handle.write("</tr>\r\n")
    else:
      if self.Type.Structure<>None:
        reference = self.Name.AsReference(parentReference)
        self.Type.Structure.WriteFieldsToHTML(catalog, reference, offset, handle)            

    return self.Size(catalog.Header)
  
  def Size(self, header):
    if self.Name.IsPointer() or self.Name.IsMethodPointer():
      return header.PointerSize*self.Name.ArraySize()
    else:
      return self.Type.Size*self.Name.ArraySize()

    
######################################################
# Main
######################################################

#create a temp blend file for dna parsing
print("1: write temp blend file with SDNA info")
if Blender<>None:
  print(" saving to: "+Filename_Blend)
  Blender.Save(Filename_Blend, 1)
else:
  print(" skipping not running in Blender (blender -P dna.py)")


#read blend header from blend file
if os.path.exists(Filename_Blend):
  print("2: read file")
  handle = open(Filename_Blend, "rb")
  Header = BlendFileHeader(handle)

#seek to dna1 file block
  print("3: seek DNA1 file-block")
  block = FileBlockHeader(handle, Header)
  while block.Code != "DNA1":
    block.skip(handle)
    block = FileBlockHeader(handle, Header)
  
#read dna record from blend file
  print("4: read DNA1 file-block")
  catalog = DNACatalog(Header, block, handle)

#close temp file
  print("5: close and delete temp blend")
  handle.close()
  if Blender <> None:
    os.remove(Filename_Blend)

#export dna to xhtml
  print("6: export sdna to xhtml file")
  handleHTML = open(Filename_HTML, "w")
  catalog.WriteToHTML(handleHTML)
  handleHTML.close()

# only write the css when not exist (templating)
  if not os.path.exists(Filename_CSS): 
    handleCSS = open(Filename_CSS, "w")
    catalog.WriteToCSS(handleCSS)
    handleCSS.close()


#quit blender
  print("7: quit blender")
  if Blender <> None:
    Blender.Quit()
  
else:
  print("Filename "+Filename_Blend+" does not exists")
  
