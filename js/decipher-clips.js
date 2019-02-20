    /*
    *   # DO NOT COPY OR MODIFY THIS CODE #
    *   Author: Joshua Harry Johanson
    *   E-mail: joshuaharry97@gmail.com
    *
    */

    function DecipherClips(codemirror) {
        this.codemirror = codemirror
    }
    
    DecipherClips.prototype.cleanInput = function(input) {
        return input.filter(x => x != "")
    }
    
    DecipherClips.prototype.formatQuestion = function(input) {
        var extractedLabel = input.match(/\w+/)[0].trim()
        var label = /^\d+$/.test(extractedLabel) ? "Q" + extractedLabel : extractedLabel
        var elements = input.match(/<col.*|<group.*|<row.*|<choice.*|<exec.*>.*<\/<col.*|<\/group.*|<\/row.*|<\/choice.*|<\/exec.*>/gm)
        var title = input
            .replace(/\w+\.*/, "")
            .replace(/<col.*|<group.*|<row.*|<choice.*|<exec.*>.*<\/<col.*|<\/group.*|<\/row.*|<\/choice.*|<\/exec.*>/gm, "")
            .replace(/\n/gm, "\x20")
            .trim()
        elements = elements != null ? elements.map(x => x.trim()) : null
        return {questionLabel: label, questionTitle: title, questionElements: elements}
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

    DecipherClips.prototype.constructQuestion = function(tag, label, title, attributes, elements) {
        var tab = "\x20".repeat(2)
        var comment = ""
        var hasRows = elements != null ? elements.some(x => x.includes("<row")) : false
        var hasCols = elements != null ? elements.some(x => x.includes("<col")) : false
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        var gridQuestion = hasRows && hasCols
        var output = "<" + tag + "\n"
        output += tab + "label=\"" + label + "\""
        switch(tag) {
            case "radio":
            comment = gridQuestion ? "Select one in each row" : "Select one"
            break
            
            case "checkbox":
            comment = "Select all that apply"
            break

            case "textbox":
            comment = "Please be as specific as possible"
            break
            case "textarea":
            comment = "Please be as specific as possible"
            break

            case "number":
            comment = "Please enter a whole number"
            break

            default:
            comment = ""
            break
        }
        for(var key in attributes) {
            if(attributes[key] != null && attributes[key] !== "") {
                output += "\n" + tab + key + "=\"" + attributes[key] + "\""
            }
        }
        output += ">"
        output += "\n" + tab + "<title>" + title + "</title>"
        output += comment != "" ? "\n" + tab + "<comment>" + comment + "</comment>" : ""
        if(elements != null) {
            for(var i = 0; i < elements.length; i++) {
                var exclusive = (tag === "checkbox") && noanswerKeyword.some(x => elements[i].toLowerCase().includes(x))
                var element = exclusive ? this.addAttribute(elements[i], { exclusive: 1}) : elements[i]
                output += "\n" + tab + element
            }
        }
        output += "\n</" + tag + ">"
        return output
    }

    DecipherClips.prototype.addAttribute = function(element, attributes) {
        var space = "\x20"
        var output = element.split(/>.+</)
        var startTag = output[0]
        var endTag = output[1]
        //var innerText = element.match(/(?<=>).+(?=<)/)
        var innerText = element.match(/(?:<.+>)(.+)(?:<\/.*>)/)[1]
        for(var key in attributes) {
            if(attributes[key] != null && attributes[key] !== "") {
                startTag += space + key + "=\"" + attributes[key] + "\""
            }
        }
        startTag += ">"
        endTag = "<" + endTag
        output = startTag + innerText + endTag
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
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)
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
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeRowsMatchLabel = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "row"
            var matchedLabel = selection[i].match(/\d+/)
            var innerText = this.escapeInput(selection[i].replace(/\d+\.*/, "")).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + matchedLabel,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeRowsMatchValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var extraKeyword = ["other", "specify"]
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "row"
            var matchedLabel = selection[i].match(/\d+/)
            var innerText = this.escapeInput(selection[i].replace(/\d+\.*/, "")).trim()
            var openEnded = extraKeyword.every(x => innerText.toLowerCase().includes(x))
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "r" + matchedLabel,
                value: matchedLabel,
                open: openEnded ? "1" : "",
                openSize: openEnded ? "25" : "",
                randomize: openEnded || anchor ? "0" : ""
            }
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)
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
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)    
    }

    DecipherClips.prototype.makeColsMatchLabel = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "col"
            var matchedLabel = selection[i].match(/\d+/)
            var innerText = this.escapeInput(selection[i].replace(/\d+\.*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "c" + matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)    
    }

    DecipherClips.prototype.makeColsMatchValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "col"
            var matchedLabel = selection[i].match(/\d+/)
            var innerText = this.escapeInput(selection[i].replace(/\d+\.*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "c" + matchedLabel,
                value: matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)    
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
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)        
    }

    DecipherClips.prototype.makeChoicesMatchLabel = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "choice"
            var matchedLabel = selection[i].match(/\d+/)
            var innerText = this.escapeInput(selection[i].replace(/\d+\.*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "ch" + matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)        
    }

    DecipherClips.prototype.makeChoicesMatchValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        var tab = "\x20".repeat(2)
        var noanswerKeyword = ["none of the above", "none of these", "don\'t know", "prefer not to answer"]
        for(var i = 0; i < selection.length; i++) {
            var tag = "choice"
            var matchedLabel = selection[i].match(/\d+/)
            var innerText = this.escapeInput(selection[i].replace(/\d+\.*/, "")).trim()
            var anchor = noanswerKeyword.some(x => innerText.toLowerCase().includes(x))
            var attributes = {
                label: "ch" + matchedLabel,
                value: matchedLabel,
                randomize: anchor ? "0" : ""
            }
            output += this.constructTag(tag,attributes,innerText) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)        
    }

    DecipherClips.prototype.makeRadio = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var tag = "radio"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            optional: 0,
            where: "survey"
        }
        var output = this.constructQuestion(tag,label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeCheckbox = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var tag = "checkbox"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            atleast: 1,
            where: "survey"
        }
        var output = this.constructQuestion(tag,label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeSelect = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var tag = "select"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = null
        var output = this.constructQuestion(tag,label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeNumber = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var tag = "number"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            size: 3,
            optional: 0
        }
        var output = this.constructQuestion(tag,label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeTextbox = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var tag = "text"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            size: 40,
            optional: 0
        }
        var output = this.constructQuestion(tag,label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeTextArea = function() {
        var selection = this.codemirror.getSelection()
        var input = this.formatQuestion(selection)
        var tag = "textarea"
        var title = input["questionTitle"]
        var label = input["questionLabel"]
        var elements = input["questionElements"]
        var attributes = {
            optional: 0
        }
        var output = this.constructQuestion(tag,label, title, attributes, elements)
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.addValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        for(var i = 0; i < selection.length; i++) {
            var extractValue = selection[i].match(/\d+/)
            output += this.addAttribute(selection[i], { value: extractValue }) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.removeValues = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        for(var i = 0; i < selection.length; i++) {
            output += this.removeAttribute(selection[i], ["value"]) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeHTML = function(label) {
        var selection = this.codemirror.getSelection().trim()
        var output = "<html label=\"" + label + "\" where=\"survey\">\n"
        output += selection.length > 0 ? selection.replace(/^\s*$/gm, "<br/>".repeat(2)) + "\n" : "\n".repeat(3)
        output += "</html>"
        output += "\n<suspend/>"
        this.codemirror.replaceSelection(output)
    }

    DecipherClips.prototype.makeBlock = function(label) {
        var selection = this.codemirror.getSelection().trim()
        var tab = "\x20".repeat(2)
        var output = "<block label=\"" + label + "\" cond=\"1\">\n"
        output += selection.length > 0 ? selection.split("\n").map(x => tab + x).join("\n") : ""
        output += "\n</block>"
        this.codemirror.replaceSelection(output)
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
        this.codemirror.replaceSelection(output)
    }    
    
    DecipherClips.prototype.wrapTag = function(tag) {
        var selection = this.codemirror.getSelection().trim()
        var startTag = "<" + tag + ">"
        var closeTag = "</" + tag + ">"
        var wrappedText = startTag + selection + closeTag
        return this.codemirror.replaceSelection(wrappedText)
    }

    DecipherClips.prototype.assignGroup = function(groupLabel) {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        for(var i = 0; i < selection.length; i++) {
            output += this.addAttribute(selection[i], { groups: groupLabel }) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)        
    }

    DecipherClips.prototype.removeGroup = function() {
        var selection = this.cleanInput(this.codemirror.getSelection().split("\n"))
        var output = ""
        for(var i = 0; i < selection.length; i++) {
            output += this.removeAttribute(selection[i], ["groups"]) + "\n"
        }
        output = output.replace(/\n$/, "")
        this.codemirror.replaceSelection(output)
    }    
    
    