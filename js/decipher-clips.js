    /*
    *   # DO NOT COPY OR MODIFY THIS CODE #
    *   Author: Joshua Harry Johanson
    *   E-mail: joshuaharry97@gmail.com
    *
    */

    function DecipherClips(codemirror, options) {
        var defaultOptions = {
            radioComment: "Please select one",
            radioGridComment: "Please select one in each row",
            checkboxComment: "Please select all that apply",
            textComment: "Please be as specific as possible",
            textareaComment: "Please be as specific as possible",
            numberComment: "Please enter a whole number",
            floatComment: "",
            selectComment: "",
            datepickerComment: "Please select a date",
            sliderratingComment: "Drag the slider to a point on the scale"
        }
        this.codemirror = codemirror
        this.options = Object.assign(defaultOptions, options || {})
    }
    
    DecipherClips.prototype.cleanInput = function(input) {
        return input.filter(x => x != "")
    }
    
    DecipherClips.prototype.formatQuestion = function(input) {
        var elements = this.getElements(input)
        input = elements ? input.substr(0, input.indexOf(elements[0])) : input
        input = input.replace(/\n/g, "\x20").trim()
        var attributeMatch = input.match(/([a-zA-Z0-9]*)(?:[\=\:\.\s]*)([^]*)/)
        var label = /^\d+$/.test(attributeMatch[1]) ? "Q" + attributeMatch[1] : attributeMatch[1]
        var title = attributeMatch[2].trim()
        return { questionLabel: label, questionTitle: title, questionElements: elements }
    }

    DecipherClips.prototype.getElements = function(input) {
        input = input.replace(/\n\n/gm, "")
        var searchElement = ["comment", "row", "col", "choice", "exec", "validate", "group", "insert"]
        var regexPattern = searchElement.map(x => "[^\\S\\r\\n]*<" + x + ".*?>([^]*?)</" + x + ">|[^\\S\\r\\n]<" + x + ".*?>")
        var elements = input.match(new RegExp(regexPattern.join("|"), "gm"))        
        return elements
    }
    
    DecipherClips.prototype.escapeInput = function(input) {
        return input.replace(/&/g, "&amp;")
    }
    
    DecipherClips.prototype.constructTag = function(tag, attributes, inner) {
        var output = "<" + tag
        for(var key in attributes) {
            if(attributes[key] != null && attributes[key] != "") {
                output += "\x20" + key + "=\""+ attributes[key] + "\""
            }
        }
        output += ">"
        output += inner
        output += "</" + tag + ">"
        return output
    }
    
    DecipherClips.prototype.constructQuestion = function(type, label, title, attributes, elements) {
        var tab = "\x20".repeat(2)
        var tag = ""
        var comment = ""
        var hasComment = elements != null ? elements.some(x => x.includes("<comment")) : false
        var hasRows = elements != null ? elements.some(x => x.includes("<row")) : false
        var hasCols = elements != null ? elements.some(x => x.includes("<col")) : false
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        var gridQuestion = hasRows && hasCols

        switch(type) {

            case "radio":
            tag = "radio"
            comment = gridQuestion ? this.options.radioGridComment : this.options.radioComment
            break
            
            case "checkbox":
            tag = "checkbox"
            comment = this.options.checkboxComment
            break
            
            case "text":
            tag = "text"
            comment = this.options.textComment
            break
            
            case "textarea":
            tag = "textarea"
            comment = this.options.textareaComment
            break
            
            case "number":
            tag = "number"
            comment = this.options.numberComment
            break
            
            case "float":
            tag = "float"
            comment = this.options.floatComment
            break

            case "select":
            tag = "select"
            comment = this.options.selectComment
            break

            case "datepicker":
            tag = "text"
            comment = this.options.datepickerComment
            break

            case "sliderrating":
            tag = "select"
            comment = this.options.sliderratingComment
            break

        } 

        comment = hasComment ? elements.splice(elements.findIndex(x => x.includes("<comment")), 1) : comment
        comment = (!hasComment && comment) ? "<comment>" + comment + "</comment>" : comment

        var output = "<" + tag + "\n"
        output += tab + "label=\"" + label + "\""

        for(var key in attributes) {
            if(attributes[key] != null && attributes[key] !== "") {
                output += "\n" + tab + key + "=\"" + attributes[key] + "\""
            }
        }

        output += ">"
        output += "\n" + tab + "<title>" + title + "</title>"
        output += comment ? "\n" + tab + comment : ""
        if(elements != null) {
            for(var i = 0; i < elements.length; i++) {
                var exclusive = (tag === "checkbox") && noanswerKeyword.some(x => elements[i].toLowerCase().includes(x))
                var element = exclusive ? this.addAttribute(elements[i], { exclusive: 1}) : elements[i]
                output += "\n" + tab + element.trim()
            }
        }
        output += "\n</" + tag + ">"
        return output
    }

    DecipherClips.prototype.addAttribute = function(element, attributes) {
        var space = "\x20"
        var indent = space.repeat(/^\s+/.test(element) ? element.match(/^\s+/)[0].length : 0)
        var selfClosingTag = /<(.+)\/>/.test(element)
        var extractedElement = selfClosingTag ? element.match(/<(.+)\/>/) : element.match(/<(.+)>([^]*?)<\/(.+)>/) 
        var innerTag = extractedElement[1]
        var innerText = selfClosingTag ? "" : extractedElement[2]
        var closingTag = selfClosingTag ? "" : extractedElement[3]
        var output = indent + "<" + innerTag
        for(var key in attributes) {
            if(attributes[key] != null && attributes[key] !== "") {
                output += space + key + "=\"" + attributes[key] + "\""
            }
        }
        output += selfClosingTag ? "/>" : ">" + innerText + "</" + closingTag + ">"
        return output
    }
    
    DecipherClips.prototype.removeAttribute = function(element, attributes) {
        var output = ""
        for(var i = 0; i < attributes.length; i++) {
            var removeAttribute = new RegExp("\\s" + attributes[i] + "=\".+?\"", "g")
            output += element.replace(removeAttribute, "")
        }
        return output
    }
    
    DecipherClips.prototype.getAttributes = function(element) {
        var attributes = {}
        var extractedAttributes = element.match(/\w+=\".+\"/g).join().split(/[\s]/)
        extractedAttributes.forEach(function(attribute) {
            var splitPair = attribute.split(/[=]/)
            attributes[splitPair[0]] = splitPair[1].replace(/\"/g, "")
        }) 
        return attributes
    }

    DecipherClips.prototype.getInnerText = function(element) {
        var innerText = element.match(/<.*?>([^]*?)<\/.*?>/)
        return innerText && innerText[1] || null
    }
    
    DecipherClips.prototype.makeGroups = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        for(var i = 0; i < selection.length; i++) {
            var tag = "group"
            var innerText = this.escapeInput(selection[i]).trim()
            var attributes = {
                label: "g" + (i+1),
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")
    }

    DecipherClips.prototype.makeCases = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        for(var i = 0; i < selection.length; i++) {
            var tag = "case"
            var innerText = this.escapeInput(selection[i]).trim()
            var attributes = {
                label: "c" + (i+1),
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")        
    }
    
    DecipherClips.prototype.makeRows = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]

        for(var i = 0; i < selection.length; i++) {
            var tag = "row"
            var innerText = this.escapeInput(selection[i]).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + (i+1),
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")
    }

    DecipherClips.prototype.makeRowsLowToHigh = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "row"
            var innerText = this.escapeInput(selection[i]).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + (i+1),
                value: i+1,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""            
        }
        this.codemirror.replaceSelection(output, "around")        
    }
    
    DecipherClips.prototype.makeRowsHighToLow = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = selection.length - 1; i >= 0; i--) {
            var tag = "row"
            var innerText = this.escapeInput(selection[i]).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + (i+1),
                value: i+1,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += selection.length - 1 != 0 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")        
    }

    DecipherClips.prototype.makeRowsMatchLabel = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "row"
            var matchedLabel = selection[i].match(/^\d+/)
            var innerText = this.escapeInput(selection[i].replace(/^\d+[\.\=\:\s]*/, "")).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + matchedLabel,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeRowsMatchValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "row"
            var matchedLabel = selection[i].trim().match(/^\d+/)
            var innerText = this.escapeInput(selection[i].replace(/^\d+[\.\=\:\s]*/, "")).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + matchedLabel,
                value: matchedLabel,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.convertToRows = function() {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            var tag = "row"
            var attributes = this.getAttributes(elements[i])
            var innerText = this.getInnerText(elements[i])
            var tab = "\x20".repeat(/^\s+/.test(elements[i]) ? elements[i].match(/^\s+/)[0].length : 0)
            attributes["label"] = "r" + attributes["label"].match(/[\d]+/)
            output += tab + this.constructTag(tag, attributes, innerText)
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeCols = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "col"
            var innerText = this.escapeInput(selection[i]).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "c" + (i+1),
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")    
    }

    DecipherClips.prototype.makeColsLowToHigh = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "col"
            var innerText = this.escapeInput(selection[i]).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "c" + (i+1),
                value: i+1,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")        
    }
    
    DecipherClips.prototype.makeColsHighToLow = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = selection.length - 1; i >= 0; i--) {
            var tag = "col"
            var innerText = this.escapeInput(selection[i]).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + (i+1),
                value: i+1,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += selection.length - 1 != 0 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")           
    }

    DecipherClips.prototype.makeColsMatchLabel = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "col"
            var matchedLabel = selection[i].match(/^\d+/) 
            var innerText = this.escapeInput(selection[i].replace(/^\d+[\.\=\:\s]*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "c" + matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")    
    }
    
    DecipherClips.prototype.makeColsMatchValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "col"
            var matchedLabel = selection[i].match(/^\d+/)
            var innerText = this.escapeInput(selection[i].replace(/^\d+[\.\=\:\s]*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "c" + matchedLabel,
                value: matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")    
    }
    
    DecipherClips.prototype.convertToCols = function() {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            var tag = "col"
            var attributes = this.getAttributes(elements[i])
            var innerText = this.getInnerText(elements[i])
            var tab = "\x20".repeat(/^\s+/.test(elements[i]) ? elements[i].match(/^\s+/)[0].length : 0)
            attributes["label"] = "c" + attributes["label"].match(/[\d]+/)
            output += tab + this.constructTag(tag, attributes, innerText)
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")
    }  
    
    DecipherClips.prototype.makeChoices = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "choice"
            var innerText = this.escapeInput(selection[i]).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "ch" + (i+1),
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")        
    }

    DecipherClips.prototype.makeChoicesLowToHigh = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "choice"
            var innerText = this.escapeInput(selection[i]).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "ch" + (i+1),
                value: i+1,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")        
    }
    
    DecipherClips.prototype.makeChoicesHighToLow = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = selection.length - 1; i >= 0; i--) {
            var tag = "choice"
            var innerText = this.escapeInput(selection[i]).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "ch" + (i+1),
                value: i+1,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += selection.length - 1 != 0 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")          
    }   

    DecipherClips.prototype.makeChoicesMatchLabel = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "choice"
            var matchedLabel = selection[i].match(/^\d+/)
            var innerText = this.escapeInput(selection[i].replace(/^\d+[\.\=\:\s]*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "ch" + matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")        
    }
    
    DecipherClips.prototype.makeChoicesMatchValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "choice"
            var matchedLabel = selection[i].match(/^\d+/)
            var innerText = this.escapeInput(selection[i].replace(/^\d+[\.\=\:\s]*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "ch" + matchedLabel,
                value: matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag, attributes, innerText)
            output += i != selection.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")        
    }
    
    DecipherClips.prototype.convertToChoices = function() {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            var tag = "choice"
            var attributes = this.getAttributes(elements[i])
            var innerText = this.getInnerText(elements[i])
            var tab = "\x20".repeat(/^\s+/.test(elements[i]) ? elements[i].match(/^\s+/)[0].length : 0)
            attributes["label"] = "ch" + attributes["label"].match(/[\d]+/)
            output += tab + this.constructTag(tag, attributes, innerText)
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")
    } 
    
    DecipherClips.prototype.makeRadio = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "radio"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            optional: 0
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeCheckbox = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "checkbox"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            atleast: 1
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeSelect = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var tag = "select"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = null
        var output = this.constructQuestion(tag, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeNumber = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "number"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            size: 3,
            optional: 0
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }

    DecipherClips.prototype.makeFloat = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "float"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            size: 3,
            optional: 0
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeText = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "text"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            size: 40,
            optional: 0
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeTextArea = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "textarea"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            optional: 0
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }

    DecipherClips.prototype.makeDatePicker = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "datepicker"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            size: 25,
            uses: "fvdatepicker.1",
            verify: "dateRange(mm/dd/yyyy, any, any)",
            optional: 0
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }

    DecipherClips.prototype.makeSliderRating = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var type = "sliderrating"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            "ss:questionClassNames": "sq-sliderpoints",
            "uses": "sliderpoints.3",
            "optional": 0
        }
        var output = this.constructQuestion(type, label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")        
    }

    DecipherClips.prototype.makeDefine = function(label) {
        var selection = this.codemirror.getSelection().split("\n")
        var tab = "\x20".repeat(2)
        var output = "<define label=\"" + label + "\">\n"
        for(var i = 0; i < selection.length; i++) {
            output += tab + selection[i].trim() + "\n"
        }
        output += "</define>"
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")        
    }

    DecipherClips.prototype.makePipe = function(label) {
        var selection = this.codemirror.getSelection().split("\n")
        var tab = "\x20".repeat(2)
        var output = "<pipe label=\"" + label + "\">\n"
        for(var i = 0; i < selection.length; i++) {
            output += tab + selection[i].trim() + "\n"
        }
        output += "</pipe>"
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")       
    }
    
    DecipherClips.prototype.addValues = function() {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            var matchedValue = elements[i].match(/[\d]+/)
            output += this.addAttribute(elements[i], { value: matchedValue })
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.removeValues = function() {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            output += this.removeAttribute(elements[i], ["value"])
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")  
    }
    
    DecipherClips.prototype.makeHTML = function(label) {
        var selection = this.codemirror.getSelection().trim()
        var output = "<html label=\"" + label + "\" where=\"survey\">\n"
        output += selection.length > 0 ? selection.replace(/^\s*$/gm, "<br/>".repeat(2)) + "\n" : "\n".repeat(3)
        output += "</html>"
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeBlock = function(label) {
        var selection = this.codemirror.getSelection().trim()
        var tab = "\x20".repeat(2)
        var output = "<block label=\"" + label + "\" cond=\"1\">\n"
        output += selection.length > 0 ? selection.split("\n").map(x => tab + x).join("\n") : ""
        output += "\n</block>"
        this.codemirror.replaceSelection(output, "around")
    }
    
    DecipherClips.prototype.makeLoop = function() {
        var selection = this.codemirror.getSelection()
        var tab = "\x20".repeat(2)
        var output = "<loop label=\"\" vars=\"\">\n"
        output += tab + "<block label=\"\" cond=\"1\">" + "\n".repeat(2)
        output += tab + "</block>\n"
        output += tab + "<looprow label=\"\" cond=\"1\">\n"
        output += tab.repeat(2) + "<loopvar name=\"\"></loopvar>\n"
        output += tab + "</looprow>\n"
        output += "</loop>"
        this.codemirror.replaceSelection(output, "around")
    }    
    
    DecipherClips.prototype.wrapTag = function(tag) {
        var selection = this.codemirror.getSelection().trim()
        var startTag = "<" + tag + ">"
        var closeTag = "</" + tag + ">"
        var wrappedText = startTag + selection + closeTag
        this.codemirror.replaceSelection(wrappedText, "around")
    }
    
    DecipherClips.prototype.assignGroup = function(groupLabel) {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            var matchedValue = elements[i].match(/[\d]+/)
            output += this.addAttribute(elements[i], { groups: groupLabel })
            output += i != elements.length - 1 ? "\n" : ""
        }

    }
    
    DecipherClips.prototype.removeGroup = function() {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            output += this.removeAttribute(elements[i], ["groups"])
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")      }    
    
    DecipherClips.prototype.addCond = function(condValue) {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            output += this.addAttribute(elements[i], { cond: condValue })
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")    
    }
    
    DecipherClips.prototype.removeCond = function() {
        var elements = this.getElements(this.codemirror.getSelection())
        var output = ""
        for(var i = 0; i < elements.length; i++) {
            output += this.removeAttribute(elements[i], ["cond"])
            output += i != elements.length - 1 ? "\n" : ""
        }
        this.codemirror.replaceSelection(output, "around")          
    }

    DecipherClips.prototype.makeComment = function() {
        var selection = this.codemirror.replaceSelection(/\n\n/gm, "")
        var output = "<comment>" + selection.trim().replace(/\n/gm, "\x20") + "</comment>"
        this.codemirror.replaceSelection(output, "around")
    }

    