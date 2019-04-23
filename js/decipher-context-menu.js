jQuery(function() {

  $.contextMenu({
      selector: '.CodeMirror',
      zIndex: 100,
      items: {
        cut: {
          name: "Cut",
          icon: "cut",
          callback: function() {
          navigator.clipboard.writeText(editor.getSelection())
          .then(() => {
                editor.replaceSelection("")
          }) 
          .catch(() => {
            alert("Command failed")
          })  
          }
        },
          copy: {
              name: "Copy",
              icon: "copy",
              callback: function() {
          navigator.clipboard.writeText(editor.getSelection())
          .then(() => {
                //TODO: do nothing 
          }) 
          .catch(() => {
            alert("Command failed")
          })        
              }
          },
          paste: {
            name: "Paste",
            icon: "paste",
            callback: function() {
              navigator.clipboard.readText()
              .then(text => {
                  editor.replaceSelection(text)
              })
              .catch(() => {
                alert("Command failed")
              })
            }
          },
          RowMenu: {
            name: "Rows",
            items: {
              MakeRows: {
                name: "Make rows",
                callback: function() {
                  decipherclips.makeRows()
                }
              },
              MakeRowsLowToHigh: {
                name: "Make rows L-H",
                callback: function() {
                  decipherclips.makeRowsLowToHigh()
                }
              },
              MakeRowsHighToLow: {
                name: "Make rows H-L",
                callback: function() {
                  decipherclips.makeRowsHighToLow()
                }
              },
              MakeRowsMatchLabel: {
                name: "Make rows match label",
                callback: function() {
                  decipherclips.makeRowsMatchLabel()
                }
              },
              MakeRowsMatchValues: {
                name: "Make rows match values",
                callback: function() {
                  decipherclips.makeRowsMatchValues()
                }
              },
              ConvertToRows: {
                name: "Convert elements to rows",
                callback: function() {
                  decipherclips.convertToRows()
                }
              }
            }
          },
          ColMenu: {
            name: "Column",
            items: {
              MakeCols: {
                name: "Make columns",
                callback: function() {
                  decipherclips.makeCols()
                }
              },
              MakeColsLowToHigh: {
                name: "Make columns L-H",
                callback: function() {
                  decipherclips.makeColsLowToHigh()
                }
              },
              MakeColsHighToLow: {
                name: "Make columns H-L",
                callback: function() {
                  decipherclips.makeColsHighToLow()
                }
              },              
              MakeColsMatchLabel: {
                name: "Make columns match label",
                callback: function() {
                  decipherclips.makeColsMatchLabel()
                }
              },
              MakeColsMatchValues: {
                name: "Make columns match values",
                callback: function() {
                  decipherclips.makeColsMatchValues()
                }
              },
              ConvertToCols: {
                name: "Convert elements to columns",
                callback: function() {
                  decipherclips.convertToCols()
                }
              }
            }
          },
          ChoiceMenu: {
            name: "Choice",
            items: {
              MakeChoices: {
                name: "Make choices",
                callback: function() {
                  decipherclips.makeChoices()
                }
              },
              MakeChoicesLowToHigh: {
                name: "Make choices L-H",
                callback: function() {
                  decipherclips.makeChoicesLowToHigh()
                }
              },
              MakeChoicesHighToLow: {
                name: "Make choices H-L",
                callback: function() {
                  decipherclips.makeChoicesHighToLow()
                }
              },  
              MakeChoicesMatchLabel: {
                name: "Make choice match label",
                callback: function() {
                  decipherclips.makeChoicesMatchLabel()
                }
              },
              MakeChoicesMatchValues: {
                name: "Make choices match values",
                callback: function() {
                  decipherclips.makeChoicesMatchValues()
                }
              },
              ConvertToChoices: {
                name: "Convert element to choices",
                callback: function() {
                  decipherclips.convertToChoices()
                }
              }
            }
          },
          Groups: {
              name: "Group",
              items: {
                  MakeGroups: {
                      name: "Make groups",
                      callback: function() {
                          decipherclips.makeGroups()
                      }
                  },
                  AssignGroup: {
                      name: "Assign group",
                      callback: function() {
                          openHelperDialog(editor, "Enter group to assign", function(e) {
                              decipherclips.assignGroup(e)
                          })
                      }
                  },
                  RemoveGroup: {
                      name: "Remove group",
                      callback: function() {
                          decipherclips.removeGroup()
                      }
                  }
              }
          },
          QuestionsMenu: {
            name: "Questions",
            items: {
              Radio: {
                name: "Radio",
                icon: "fa-dot-circle",
                callback: function() {
                  decipherclips.makeRadio()
                }
              },
              Checkbox: {
                name: "Checkbox",
                callback: function() {
                  decipherclips.makeCheckbox()
                }
              },
              Select: {
                name: "Select",
                callback: function() {
                  decipherclips.makeSelect()
                }
              },
              Textbox: {
                name: "Textbox",
                callback: function() {
                  decipherclips.makeTextbox()
                }
              },
              TextArea: {
                name: "TextArea",
                callback: function() {
                  decipherclips.makeTextArea()
                }
              },
              Number: {
                name: "Number",
                callback: function() {
                  decipherclips.makeNumber()
                }
              },
              HTML: {
                name: "HTML",
                callback: function() {
                  var htmlLabel = prompt("Enter label for HTML: ")
                  htmlLabel != null ? decipherclips.makeHTML(htmlLabel) : null
                }
              },
              Block: {
                name: "Block",
                callback: function() {
                  openHelperDialog(editor, "Enter group to assign", function(e) {
                      decipherclips.makeBlock(e)
                  })
                }
              },
              Loop: {
                name: "Loop",
                callback: function() {
                  decipherclips.makeLoop()
                }
              }
            }
          },
          Other: {
              name: "Other",
              items: {
                  MakeComment: {
                    name: "Make comment",
                    callback: function() {
                      decipherclips.makeComment()
                    }
                  },
                  MakePipe: {
                    name: "Make pipe",
                    callback: function() {
                      var label = prompt("Enter label: ")
                      decipherclips.makePipe(label)
                    }
                  },
                  MakeCases: {
                    name: "Make cases",
                    callback: function() {
                      decipherclips.makeCases()
                    }
                  },
                  WrapTag: {
                      name: "Wrap with tag",
                      callback: function() {
                        var tag = prompt("Enter tag: ")
                        decipherclips.wrapTag(tag)  
                      }
                  },
                  AddCond: {
                      name: "Add cond attribute",
                      callback: function() {
                        var cond = prompt("Enter condition: ")
                        decipherclips.addCond(cond)
                      }
                  },
                  RemoveCond: {
                      name: "Remove cond attribute",
                      callback: function() {
                          decipherclips.removeCond()
                      }
                  },
                  AddValues: {
                    name: "Add value attribute",
                    callback: function() {
                      decipherclips.addValues()
                    }
                  },
                  RemoveValues: {
                    name: "Remove value attribute",
                    callback: function() {
                      decipherclips.removeValues()
                    }
                  }   
              }  
          }
      }
  });  
})